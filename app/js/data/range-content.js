'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.u;
const io = nkm.io;

const UNICODE = require(`../unicode`);
const SIGNAL = require(`../signal`);
const GlyphVariant = require(`./glyph-variant-data-block`);
const IDS = require(`./ids`);
const IDS_EXT = require(`./ids-ext`);
const UTILS = require(`./utils`);

class RangeContent extends nkm.com.pool.DisposableObjectEx {
    constructor() { super(); }

    //#region Static utils

    static CountGlyphs = (p_family) => {
        return p_family._glyphs.count;
    };

    static CountLiga = (p_family) => {
        return p_family._ligatureSet.size;
    }

    static CountComponents = (p_family) => {
        return 0;
    }

    static CountAll = (p_family) => {
        return UNICODE.instance._charList.length;
    }

    static FetchFamilyGlyphAll(p_family) {
        try {
            p_family._glyphUnicodeCache.sort((a, b) => { return a.length > 6 ? 1 : parseInt(a, 16) - parseInt(b, 16); });
        } catch (e) { }
        return p_family._glyphUnicodeCache;
    }

    static FetchFamilyGlyphLiga(p_family) {
        let result = [];
        p_family._glyphs.ForEach(
            (item, index) => {
                if (p_family._ligatureSet.has(item)) { result.push(item.Get(IDS.UNICODE)); }
            });
        try {
            result.sort((a, b) => { return parseInt(a, 16) - parseInt(b, 16); });
        } catch (e) { }
        return result;
    }

    static FetchFamilyComponents(p_family) {
        return [];
    }

    static FetchAllKnowGlyphs(p_family) {
        return UNICODE.instance._charList;
    }

    //#endregion

    _Init() {

        super._Init();
        this._content = [];
        this._displayRange = null;
        this._rangeInfos = null;

        this._family = null;
        this._ready = false;
        this._fetchFn = null;

        this._familyObserver = new nkm.com.signals.Observer();
        this._familyObserver
            .Hook(SIGNAL.GLYPH_ADDED, this._OnGlyphAdded, this)
            .Hook(SIGNAL.GLYPH_REMOVED, this._OnGlyphRemoved, this);

        this._delayedRecompute = nkm.com.DelayedCall(this._Bind(this.RecomputeContent));
        this._delayedDynamicRecompute = nkm.com.DelayedCall(this._Bind(this._DynamicRecompute));

    }

    get family() { return this._family; }
    set family(p_value) {
        this._family = p_value;
        this._familyObserver.ObserveOnly(this._family);
    }

    get displayRange() { return this._displayRange; }
    set displayRange(p_value) {

        if (this._displayRange == p_value) { return; }

        this._content.length = 0;

        this._displayRange = p_value;
        this._fetchFn = null;

        let rInfos = {
            indexOffset: 0,
            indexCount: 0,
            list: null,
            type: null
        };

        if (`includes` in p_value) {
            // Expect an mixed array of indices & [a,b] ranges
            rInfos.indexOffset = p_value.imin;
            rInfos.indexCount = p_value.count;
            rInfos.list = p_value.includes;
            rInfos.type = IDS_EXT.RANGE_MIXED;

            this._cachedLoopStart = 0;
            this._cachedAdvance = 0;
            this._fetchFn = this._SearchMixed;

        } else if (`start` in p_value) {
            // Block with a count & start index
            rInfos.indexOffset = p_value.start;
            rInfos.indexCount = p_value.count;
            rInfos.type = IDS_EXT.RANGE_INLINE;

            this._fetchFn = this._SearchInBlock;

        } else if (`fetchList` in p_value) {
            // Single array of unicode string, likely ligatures.
            if (this._family) {
                let customList = p_value.fetchList(this._family);
                rInfos.list = customList;
                rInfos.indexOffset = 0;
                rInfos.indexCount = rInfos.list.length;
                rInfos.type = IDS_EXT.RANGE_PLAIN;

                this._fetchFn = this._SearchPlain;
            }
        }

        this._rangeInfos = rInfos;
        this._ready = false;

        this.RecomputeContent();

    }

    get rangeInfos() { return this._rangeInfos; }

    _OnGlyphAdded() {
        if (this._displayRange.isDynamic) {
            this._delayedDynamicRecompute.Schedule();
        }
    }

    _OnGlyphRemoved() {
        if (this._displayRange.isDynamic) {
            this._delayedDynamicRecompute.Schedule();
        }
    }

    RecomputeContent() {

        if (!this._rangeInfos || !this._family) {
            this._ready = true;
            this.Broadcast(nkm.com.SIGNAL.READY, this);
            this._content.length = 0;
            return;
        }

        this._cachedLoopStart = 0;
        this._cachedAdvance = 0;

        this._fetchFn(0, this._rangeInfos.indexCount);

        this._ready = true;
        this.Broadcast(nkm.com.SIGNAL.READY, this);

    }

    _DynamicRecompute() {
        let dr = this._displayRange;
        this._displayRange = null;
        this.displayRange = dr;
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
            this._content.push(unicodeInfos);

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
            this._content.push(unicodeInfos);
        }

    }

    _SearchPlain(p_start, p_count) {

        let
            unicodeInfos;

        for (let i = p_start, n = p_start + p_count; i < n; i++) {
            let lookup = this._rangeInfos.list[i];
            if (u.isObject(lookup)) {
                this._content.push(lookup);
            } else {
                unicodeInfos = UNICODE.GetInfos(lookup);
                if (!unicodeInfos) { continue; }
                this._content.push(unicodeInfos);
            }

        }

    }

    //#endregion

}

module.exports = RangeContent;