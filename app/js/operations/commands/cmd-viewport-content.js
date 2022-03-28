//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.utils;

const UNICODE = require(`../../unicode`);
const IDS_EXT = require(`../../data/ids-ext`);

class CmdViewportContent extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._results = [];
        this._fetchFn = null;
    }

    _InternalExecute() {

        this._searchCovered = 0;
        this._displayRange = this._context._displayRanges;
        this._rangeInfos = this._context._rangeInfos;
        this._results.length = 0;

        if (this._context._searchActive) {
            for (let i = 0, n = this._context._searchSettings._results.length; i < n; i++) {
                this._PushInfos(this._context._searchSettings._results[i]);
            }
        } else {
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

            this._fetchFn(0, this._rangeInfos.indexCount);

        }

        return this._results;

    }

    //#region fetch methods

    _ProcessInfo(p_unicodeInfos) {
        return p_unicodeInfos;
    }

    _PushInfos(p_unicodeInfos) {
        let res = this._ProcessInfo(p_unicodeInfos);
        if (res != null) { this._results.push(res); }
    }

    _SearchMixed(p_start, p_count) {

        let
            index,
            unicodeInfos;

        for (let i = p_start, n = p_start + p_count; i < n; i++) {

            index = this._GetMixedIndex(i);
            if (index == -1) { continue; }
            unicodeInfos = UNICODE.instance._charList[index];
            if (!unicodeInfos) { continue; }
            this._PushInfos(unicodeInfos);

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
            this._PushInfos(unicodeInfos);
        }

    }

    _SearchPlain(p_start, p_count) {

        let
            unicodeInfos;

        for (let i = p_start, n = p_start + p_count; i < n; i++) {
            let lookup = this._rangeInfos.list[i];
            if (u.isObject(lookup)) {
                this._PushInfos(lookup);
            } else {
                unicodeInfos = UNICODE.GetInfos(lookup);
                if (!unicodeInfos) { continue; }
                this._PushInfos(unicodeInfos);
            }

        }

    }

    //#endregion


}

module.exports = CmdViewportContent;