'use strict';

const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const u = nkm.utils;
const io = nkm.io;

const SIGNAL = require(`./signal`);
const IDS = require(`./ids`);

const GlyphVariant = require(`./glyph-variant-data-block`);

class GlyphDataBlock extends nkm.data.SimpleDataBlock {

    constructor() { super(); }

    static NULL = new GlyphDataBlock();

    _Init() {

        super._Init();

        this._values = {
            [IDS.ID]: { value: '' },
            [IDS.DECIMAL]: { value: null },
            [IDS.UNICODE]: { value: null, setter: IDS.UNICODE },
            [IDS.PATH]: { value: '', setter: IDS.PATH }
        }

        this._family = null;
        this._arabic_form = null;

        this._defaultGlyph = new GlyphVariant();
        this._defaultGlyph._isDefault = true;
        this._glyphVariants = new nkm.collections.List();
        this._subFamiliesMap = new nkm.collections.Dictionary();

    }

    set family(p_value) { this._family = p_value; }
    get family() { return this._family; }

    get isLigature() { return this._unicode.length > 1; }

    get path() { return this._defaultGlyph.Get(IDS.PATH); }
    set path(p_value) {
        this._defaultGlyph.Set(IDS.PATH, p_value);
        this.CommitUpdate();
    }

    get unicode() { return this.Get(IDS.UNICODE, -1, true); }
    set unicode(p_value) {
        for (let i = 0, n = this._glyphVariants.count; i < n; i++) {
            let g = this._glyphVariants.At(i);
            g.svgGlyph.setAttribute(IDS.UNICODE, p_value);
        }
    }

    get decimal() { return this.Get(IDS.DECIMAL, -1, true); }

    get defaultGlyph(){ return this._defaultGlyph; }

    _SetDefaultVariant(p_subFamily) {
        if (!this._glyphVariants.Add(p_subFamily)) { return this._defaultGlyph; }
        this._OnGlyphVariantAdded(this._defaultGlyph, p_subFamily);
        return this._defaultGlyph;
    }

    AddVariant(p_subFamily) {
        if (!this._glyphVariants.Add(p_subFamily)) { return this._subFamiliesMap.Get(p_subFamily); }
        // TODO : Retrieve deleted variants
        let glyphVariant = com.Rent(GlyphVariant);
        this._OnGlyphVariantAdded(glyphVariant, p_subFamily);
        return glyphVariant;
    }

    _OnGlyphVariantAdded(p_glyphVariant, p_subFamily) {

        this._subFamiliesMap.Set(p_subFamily, p_glyphVariant);

        p_glyphVariant.glyph = this;
        p_glyphVariant.subFamily = p_subFamily;
        p_glyphVariant.svgGlyph.setAttribute(IDS.UNICODE, this.Get(IDS.UNICODE));

        p_glyphVariant.Watch(com.SIGNAL.UPDATED, this._OnGlyphVariantUpdated, this);
        p_subFamily.Watch(com.SIGNAL.RELEASED, this._OnSubFamilyReleased, this);

        this._Broadcast(com.SIGNAL.ITEM_ADDED, this, p_glyphVariant);

    }

    RemoveVariant(p_subFamily) {
        if (!this._glyphVariants.Remove(p_subFamily)) { return null; }
        let glyphVariant = this._subFamiliesMap.Get(p_subFamily);
        glyphVariant.subFamily = null;
        glyphVariant.Unwatch(com.SIGNAL.UPDATED, this._OnGlyphVariantUpdated, this);

        this._Broadcast(com.SIGNAL.ITEM_REMOVED, this, glyphVariant);

        return this._subFamiliesMap.Get(p_subFamily);
    }

    _OnGlyphVariantUpdated(p_glyphVariant) {
        this._Broadcast(SIGNAL.VARIANT_UPDATED, this, p_glyphVariant);
        this.CommitUpdate();
    }

    GetVariant(p_subFamily) {
        return this._subFamiliesMap.Get(p_subFamily);
    }

    _OnSubFamilyReleased(p_subFamily) {
        let glyphVariant = this._subFamiliesMap.Get(p_subFamily);
        if (glyphVariant) {
            this._subFamiliesMap.Remove(p_subFamily);
            glyphVariant.Release();
        }
    }

    _CleanUp() {
        this.family = null;
        this._unicode = null;
        super._CleanUp();
    }


}

module.exports = GlyphDataBlock;