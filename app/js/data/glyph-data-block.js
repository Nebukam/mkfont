'use strict';

const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const u = nkm.utils;
const io = nkm.io;

const SIGNAL = require(`./signal`);

const GlyphVariant = require(`./glyph-variant-data-block`);

class GlyphDataBlock extends nkm.data.DataBlock {

    constructor() { super(); }

    static NULL = new GlyphDataBlock();

    _Init() {

        super._Init();

        this._unicode = null;
        this._decimal = -1;

        this._family = null;
        this._arabic_form = null;

        this._defaultGlyph = new GlyphVariant();
        this._defaultGlyph._isDefault = true;
        this._variants = new nkm.collections.List();
        this._subFamiliesMap = new nkm.collections.Dictionary();

    }

    set family(p_value) { this._family = p_value; }
    get family() { return this._family; }

    get isLigature() { return this._unicode.length > 1; }

    get svg() { return this._defaultGlyph.svg; }
    set svg(p_value) {
        this._defaultGlyph.svg = p_value;
        this.CommitUpdate();
    }

    get unicode() { return this._unicode; }
    set unicode(p_value) {

        let oldUnicode = this._unicode;
        this._unicode = p_value;

        for (let i = 0, n = this._variants.count; i < n; i++) {
            let g = this._variants.At(i);
            g.unicode = p_value;
        }

        this._Broadcast(SIGNAL.UNICODE_CHANGED, this, oldUnicode);
        this.CommitUpdate();

    }

    get decimal() { return this._decimal; }
    set decimal(p_value) { this._decimal = p_value; }

    _SetDefaultVariant(p_subFamily) {
        if (!this._variants.Add(p_subFamily)) { return this._defaultGlyph; }
        this._subFamiliesMap.Set(p_subFamily, this._defaultGlyph);
        this._defaultGlyph.glyph = this;
        this._defaultGlyph.variant = p_subFamily;
        this._defaultGlyph.unicode = this._unicode;
        return this._defaultGlyph;
    }

    AddVariant(p_subFamily) {
        if (!this._variants.Add(p_subFamily)) { return this._subFamiliesMap.Get(p_subFamily); }
        // TODO : Retrieve deleted variants
        let glyph = com.Rent(GlyphVariant);
        this._subFamiliesMap.Set(p_subFamily, glyph);
        glyph.glyph = this;
        glyph.variant = p_subFamily;
        glyph.unicode = this._unicode;
        p_subFamily.Watch(com.SIGNAL.RELEASED, this._OnSubFamilyReleased, this);
        return glyph;
    }

    RemoveVariant(p_variant) {
        if (!this._variants.Remove(p_variant)) { return null; }
        let glyph = this._subFamiliesMap.Get(p_variant);
        glyph.variant = null;
        return this._subFamiliesMap.Get(p_variant);
    }

    GetVariant(p_variant) {
        return this._subFamiliesMap.Get(p_variant);
    }

    _OnSubFamilyReleased(p_subFamily) {
        let glyph = this._subFamiliesMap.Get(p_subFamily);
        if (glyph) {
            this._subFamiliesMap.Remove(p_subFamily);
            glyph.Release();
        }
    }

    _CleanUp() {
        this.family = null;
        this._unicode = null;
        super._CleanUp();
    }


}

module.exports = GlyphDataBlock;