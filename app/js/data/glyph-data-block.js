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

        this._parentFont = null;
        this._arabic_form = null;

        this._defaultGlyph = new GlyphVariant();
        this._variants = new nkm.collections.List();
        this._variantsMap = new nkm.collections.Dictionary();

    }

    set parentFont(p_value) { this._parentFont = p_value; }
    get parentFont() { return this._parentFont; }

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

    _SetDefaultVariant(p_variant) {
        if (!this._variants.Add(p_variant)) { return this._defaultGlyph; }
        this._variantsMap.Set(p_variant, this._defaultGlyph);
        this._defaultGlyph.variant = p_variant;
        this._defaultGlyph.unicode = this._unicode;
        return this._defaultGlyph;
    }

    AddVariant(p_variant) {
        if (!this._variants.Add(p_variant)) { return this._variantsMap.Get(p_variant); }
        // TODO : Retrieve deleted variants
        let glyph = com.Rent(GlyphVariant);
        this._variantsMap.Set(p_variant, glyph);
        glyph.variant = p_variant;
        glyph.unicode = this._unicode;
        p_variant.Watch(com.SIGNAL.RELEASED, this._OnVariantReleased, this);
        return glyph;
    }

    RemoveVariant(p_variant) {
        if (!this._variants.Remove(p_variant)) { return null; }
        let glyph = this._variantsMap.Get(p_variant);
        glyph.variant = null;
        return this._variantsMap.Get(p_variant);
    }

    GetVariant(p_variant) {
        return this._variantsMap.Get(p_variant);
    }

    _OnVariantReleased(p_variant) {
        let glyph = this._variantsMap.Get(p_variant);
        if (glyph) {
            this._variantsMap.Remove(p_variant);
            glyph.Release();
        }
    }

    _CleanUp() {
        this.parentFont = null;
        this._unicode = null;
        super._CleanUp();
    }


}

module.exports = GlyphDataBlock;