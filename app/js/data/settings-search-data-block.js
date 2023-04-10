'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.u;
const io = nkm.io;

const UNICODE = require(`../unicode`);
const SIGNAL = require(`../signal`);
const FontObjectData = require(`./font-object-data`);
const IDS_EXT = require(`./ids-ext`);
const IDS = require(`./ids`);
const ENUMS = require(`./enums`);

const base = nkm.data.SimpleDataBlock;
class SettingsSearchDataBlock extends base {

    constructor() { super(); }

    static __VALUES = this.Ext(base.__VALUES, {
        [nkm.data.IDS.SEARCH_ENABLED]: { value: false, signal: nkm.data.SIGNAL.SEARCH_TOGGLED },
        [nkm.data.IDS.SEARCH_RESULTS]: { value: null },
        [nkm.data.IDS.SEARCH_TERMS]: { value: `` },
        [nkm.data.IDS.SEARCH_CASE_SENSITIVE]: { value: false },
        [IDS_EXT.ADD_COMPOSITION]: { value: false },
        [IDS_EXT.MUST_EXISTS]: { value: false },
    });

    _Init() {

        super._Init();

        this._searchCovered = 0;
        this._cachedAdvance = 0;
        this._fetchFn = null;

        this._terms = [];

        this._rangeContent = null;
        this._displayRange = null;
        this._rangeInfos = null;
        this._ready = false;
        this._running = false;

        this._results = [];
        this._resultSet = new Set();

        this._delayedAdvance = nkm.com.DelayedCall(this._Bind(this._AdvanceSearch));

        this._family = null;

    }

    set family(p_value) { this._family = p_value; }
    get family() { return this._family; }

    get ready() { return this._ready; }
    get running() { return this._running; }
    get enabled() { return this.Get(nkm.data.IDS.SEARCH_ENABLED); }

    CommitValueUpdate(p_id, p_newValue, p_oldValue, p_silent = false) {

        super.CommitValueUpdate(p_id, p_newValue, p_oldValue, p_silent);

        if (!this.enabled) { return; }

        let descriptor = nkm.data.GetDescriptor(p_id);

        if (!descriptor ||
            !this._rangeContent)
            return;

        if (!descriptor.recompute)
            return;

        this._UpdateSearchData(this._rangeContent);

    }

    _UpdateSearchData(p_rangeContent) {

        this._rangeContent = p_rangeContent;
        this._content = this._rangeContent ? this._rangeContent._content : [];

        this._running = true;
        this._ready = false;
        this._searchCovered = 0;

        this._caseSensitive = !this.Get(nkm.data.IDS.SEARCH_CASE_SENSITIVE);
        this._addComps = this.Get(IDS_EXT.ADD_COMPOSITION);
        this._mustExists = this.Get(IDS_EXT.MUST_EXISTS);

        this._terms = UNICODE.ResolveString(this.Get(nkm.data.IDS.SEARCH_TERMS)).split(` `);
        this._upperTerms = [];
        this._upperIndexed = [];
        for (let i = 0; i < this._terms.length; i++) {
            let t = this._terms[i].trim();
            if (!t || t == ``) { this._terms.splice(i, 1); i--; }
            else {
                this._terms[i] = this._caseSensitive ? t : t.toUpperCase();
                if (t.length > 1) { this._upperTerms.push(t.toUpperCase()); }
                else { this._upperIndexed.push(t.toUpperCase()); }
            }
        }

        this._results.length = 0;
        this._resultSet.clear();

        this._AdvanceSearch();

        this.Broadcast(nkm.data.SIGNAL.SEARCH_STARTED, this);

    }

    _AdvanceSearch() {

        let length = 5000;

        if (this._searchCovered + length > this._content.length) {
            length = this._content.length - this._searchCovered;
        }

        if (length <= 0) {

            this._running = false;
            this._ready = true;

            this._values[nkm.data.IDS.SEARCH_RESULTS] = null;
            this.Set(nkm.data.IDS.SEARCH_RESULTS, this._results);

            this.Broadcast(nkm.data.SIGNAL.SEARCH_COMPLETE, this);

        } else {

            for (let i = this._searchCovered, n = this._searchCovered + length; i < n; i++) {
                this._Check(this._content[i]);
            }

            this._searchCovered += length;

            this.Broadcast(nkm.data.SIGNAL.SEARCH_PROGRESS, this._searchCovered / this._content.length);

            this._delayedAdvance.Schedule();

        }
    }

    _Check(p_unicodeInfos) {

        let pass = false;
        if (this._resultSet.has(p_unicodeInfos)) { return; }

        let exists = (p_unicodeInfos.u in this._family._glyphsMap);
        if (this._mustExists && !exists) { return; } //TODO : Tweak. This prevents us from looking into layers.

        if (this._terms.length != 0) {

            //TODO : look for layer given names


            let
                char = p_unicodeInfos.char,
                name = p_unicodeInfos.name;

            if (char) {

                if (!this._caseSensitive) { char = char.toUpperCase(); }

                if (char.length == 1) {
                    charLoop: for (let i = 0; i < this._terms.length; i++) {
                        if (char == this._terms[i]) { pass = true; break charLoop; }
                    }
                } else {
                    charLoop: for (let i = 0; i < this._terms.length; i++) {
                        if (char.includes(this._terms[i])) { pass = true; break charLoop; }
                    }
                }
            }

            if (!pass && name) {
                // Look in Glyph name (uppercase only)
                // Upperterms only contains length > 1
                nameLoop: for (let i = 0; i < this._upperTerms.length; i++) {
                    if (name.includes(this._upperTerms[i])) { pass = true; break nameLoop; }
                }
            }

            if (!pass && p_unicodeInfos.indexed) {
                let indexed = p_unicodeInfos.indexed;
                indexedLoop: for (let i = 0; i < this._upperIndexed.length; i++) {
                    if (indexed.includes(this._upperIndexed[i])) { pass = true; break indexedLoop; }
                }
            }

            if (exists) {
                //Look through layers and check if they have custom IDs that would match
                let glyph = this._family.GetGlyph(p_unicodeInfos.u);
                if (!glyph.isNull) {
                    let layers = glyph.activeVariant._layers._array;
                    for (let l = 0, ln = layers.length; l < ln; l++) {
                        let
                            layer = layers[l],
                            id = layer.Get(IDS.LYR_CUSTOM_ID),
                            localPass = false;

                        if (!layer.importedVariant || !layer._glyphInfos) { continue; }

                        if (id) {

                            if (!this._caseSensitive) { id = id.toUpperCase(); }

                            if (id.length == 1) {
                                charLoop: for (let i = 0; i < this._terms.length; i++) {
                                    if (char == this._terms[i]) { localPass = true; break charLoop; }
                                }
                            } else {
                                charLoop: for (let i = 0; i < this._terms.length; i++) {
                                    if (id.includes(this._terms[i])) { localPass = true; break charLoop; }
                                }
                            }

                        }

                        if (localPass) {
                            let infos = layer._glyphInfos;
                            if (this._mustExists) { if (!(infos.u in this._family._glyphsMap)) { continue; } }
                            this._results.push(infos);
                            this._resultSet.add(infos);
                        }

                    }
                }
            }

        } else {
            //Search active, "exists" is toggled on.
            if (this._mustExists && exists) { pass = true; }
        }

        if (!pass) { return; }

        if (this._addComps && p_unicodeInfos.relatives) {
            let relatives = p_unicodeInfos.relatives;
            for (let i = 0; i < relatives.length; i++) {
                let infos = UNICODE.instance._charMap[relatives[i]];
                if (this._mustExists) { if (!(infos.u in this._family._glyphsMap)) { continue; } }
                this._results.push(infos);
                this._resultSet.add(infos);
            }
        }

        if (pass && !this._resultSet.has(p_unicodeInfos)) {
            this._results.push(p_unicodeInfos);
            this._resultSet.add(p_unicodeInfos);
        }

    }

}

module.exports = SettingsSearchDataBlock;