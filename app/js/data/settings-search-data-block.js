'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.utils;
const io = nkm.io;

const UNICODE = require(`../unicode`);
const SIGNAL = require(`../signal`);
const SimpleDataEx = require(`./simple-data-ex`);
const IDS_EXT = require(`./ids-ext`);
const ENUMS = require(`./enums`);

class SettingsSearchDataBlock extends SimpleDataEx {

    constructor() { super(); }

    static __signalValueMap = {
        [IDS_EXT.SEARCH_ENABLED]: SIGNAL.SEARCH_TOGGLED
    };

    _Init() {

        super._Init();

        this._values = {
            [IDS_EXT.SEARCH_RESULTS]: { value: null },
            [IDS_EXT.SEARCH_ENABLED]: { value: false },
            [IDS_EXT.SEARCH_TERM]: { value: `` },
            [IDS_EXT.SHOW_DECOMPOSITION]: { value: true },
            [IDS_EXT.FILTER_ONLY_EXISTING]: { value: false },
        }

        this._searchCount = 0;
        this._searchCovered = 0;
        this._fetchFn = null;

        this._terms = [];

        this._displayRange = null;
        this._rangeInfos = null;
        this._ready = false;
        this._running = false;

        this._results = [];

        this._delayedAdvance = nkm.com.DelayedCall(this._Bind(this._AdvanceSearch));

    }

    get ready() { return this._ready; }
    get running() { return this._running; }
    get enabled() { return this.Get(IDS_EXT.SEARCH_ENABLED); }

    CommitValueUpdate(p_id, p_valueObj, p_oldValue, p_silent = false) {

        super.CommitValueUpdate(p_id, p_valueObj, p_oldValue, p_silent);

        if (!this.enabled) { return; }

        let infos = IDS_EXT.GetInfos(p_id);

        if (!infos ||
            !this._displayRange ||
            !this._rangeInfos)
            return;

        if (!infos.recompute)
            return;

        this._UpdateSearchData(this._displayRange, this._rangeInfos);

    }

    _UpdateSearchData(p_displayRange, p_rangeInfos) {

        this._running = true;
        this._ready = false;
        this._searchCount = 0;
        this._searchCovered = 0;

        this._terms = this.Get(IDS_EXT.SEARCH_TERM).split(` `);
        if (this._terms.length == 1) { if (this._terms[0] == ``) { this._terms = []; } }

        this._results = [];

        this._displayRange = p_displayRange;
        this._rangeInfos = p_rangeInfos;


        console.log(`Search data updated`, p_displayRange, p_rangeInfos, this._terms);

        switch (this._rangeInfos.type) {
            case IDS_EXT.RANGE_MIXED:
                this._cachedLoopStart = 0;
                this._cachedAdvance = 0;
                this._fetchFn = this._SearchMixed;
                break;
            case IDS_EXT.RANGE_INLINE:
                this._fetchFn = this._SearchInBlock;
                break;
            case IDS_EXT.RANGE_PLAIN:
                this._fetchFn = this._SearchPlain;
                break;
        }

        this._AdvanceSearch();

        this._Broadcast(SIGNAL.SEARCH_STARTED, this);

    }

    _AdvanceSearch() {

        let length = 10;

        if (this._searchCovered + length > this._rangeInfos.indexCount) {
            length = this._rangeInfos.indexCount - this._searchCovered;
        }

        if (length <= 0) {

            this._running = false;
            this._ready = true;

            this._values[IDS_EXT.SEARCH_RESULTS].value = null;
            this.Set(IDS_EXT.SEARCH_RESULTS, this._results);

            this._Broadcast(SIGNAL.SEARCH_COMPLETE, this);

        } else {

            this._fetchFn(this._searchCovered, length);
            this._searchCovered += length;

            this._delayedAdvance.Schedule();

        }
    }

    _ProcessInfos(p_unicodeInfos) {

        let pass = false;

        if (this._terms.length != 0) {

            let
                char = p_unicodeInfos.char,
                name = p_unicodeInfos.name;

            if (char.length == 1) {

                searchloop : for (let i = 0; i < this._terms.length; i++) {
                    let term = this._terms[i];
                    if (term.length == 1) {
                        if (char == term) { pass = true; break searchloop; }
                        continue;
                    }
                    if (name.includes(term)) { pass = true; break searchloop; }
                }

            } else {

                searchloop : for (let i = 0; i < this._terms.length; i++) {
                    let term = this._terms[i];

                    if (char.includes(term)) { pass = true; break searchloop; }
                    if (term.length == 1) { continue; }
                    if (name.includes(term)) { pass = true; break searchloop; }
                }
            }

        }

        if (pass) { 
            this._results.push(p_unicodeInfos); 
        }

    }

    //#region fetch methods

    _SearchMixed(p_start, p_count) {

        let
            index,
            unicodeInfos;

        for (let i = p_start, n = p_start + p_count; i < n; i++) {

            index = this._GetMixedIndex(i);
            if (index == -1) { continue; }
            unicodeInfos = UNICODE.instance._charList[index];
            if (!unicodeInfos) { continue; }
            this._ProcessInfos(unicodeInfos);

        }
    }

    _GetMixedIndex(p_index) {

        let
            list = this._rangeInfos.list,
            advance = this._cachedAdvance;

        for (let i = this._cachedLoopStart, n = list.length; i < n; i++) {
            let range = list[i];

            if (u.isArray(range)) {

                let
                    start = range[0],
                    end = range[1],
                    coverage = end - start + 1,
                    target = start + (p_index - advance); //+1 as range is inclusive

                if (p_index >= advance &&
                    target <= end) {
                    this._cachedLoopStart = i;
                    this._cachedAdvance = advance;
                    return target;
                }

                advance += coverage;

            } else {
                if (p_index == advance) {
                    this._cachedLoopStart = i;
                    this._cachedAdvance = advance;
                    return range;
                }
                advance++;
            }

        }

        return -1;
    }

    _SearchInBlock(p_start, p_count) {

        let
            unicodeInfos,
            start = this._rangeInfos.indexOffset + p_start,
            end = start + p_count;

        for (let i = start; i < end; i++) {
            unicodeInfos = UNICODE.GetSingle(i);
            if (!unicodeInfos) { continue; }
            this._ProcessInfos(unicodeInfos);
        }

    }

    _SearchPlain(p_start, p_count) {

        let
            unicodeInfos;

        for (let i = p_start, n = p_start + p_count; i < end; i++) {
            unicodeInfos = UNICODE.GetInfos(this._rangeInfos.list[p_index]);
            if (!unicodeInfos) { continue; }
            this._ProcessInfos(unicodeInfos);
        }

    }

    //#endregion



}

module.exports = SettingsSearchDataBlock;