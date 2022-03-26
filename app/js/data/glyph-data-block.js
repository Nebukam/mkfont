'use strict';

const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const u = nkm.utils;
const io = nkm.io;

const UNICODE = require(`../unicode`);

const SimpleDataEx = require(`./simple-data-ex`);
const SIGNAL = require(`../signal`);
const IDS = require(`./ids`);

const GlyphVariant = require(`./glyph-variant-data-block`);

class GlyphDataBlock extends SimpleDataEx {

    constructor() { super(); }

    static __defaultVariantClass = GlyphVariant;

    static __signalValueMap = {
        [IDS.UNICODE]: SIGNAL.UNICODE_CHANGED
    };

    _Init() {

        super._Init();

        this._values = {
            [IDS.GLYPH_NAME]: { value: '' },
            [IDS.UNICODE]: { value: null },
            [IDS.EXPORT_GLYPH]: { value: true }
        };

        this._family = null;
        this._arabic_form = null;
        this._unicodeInfos = null;

        this._defaultGlyph = new this.constructor.__defaultVariantClass();
        this._defaultGlyph._isDefault = true;

        this._glyphVariants = new nkm.collections.List();
        this._subFamiliesMap = new nkm.collections.Dictionary();

    }

    get resolutionFallbacks() { return [this._family]; }

    get defaultGlyph() { return this._defaultGlyph; }

    get isLigature() {
        let unc = this._values[IDS.UNICODE].value;
        return unc ? unc.includes(`+`) ? true : false : false;
    }

    set family(p_value) { this._family = p_value; }
    get family() { return this._family; }

    get unicodeInfos() {
        if (!this._unicodeInfos) { return UNICODE.GetSingle(this.Get(IDS.UNICODE)); }
        return this._unicodeInfos;
    }
    set unicodeInfos(p_value) { this._unicodeInfos = p_value; }

    //

    _SetDefaultVariant(p_subFamily) {
        if (!this._glyphVariants.Add(p_subFamily)) { return this._defaultGlyph; }
        this._OnGlyphVariantAdded(this._defaultGlyph, p_subFamily);
        return this._defaultGlyph;
    }

    // Variant management

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

        p_glyphVariant.Watch(com.SIGNAL.UPDATED, this._OnGlyphVariantUpdated, this);
        p_subFamily.Watch(com.SIGNAL.RELEASED, this._OnSubFamilyReleased, this);

        this.Broadcast(com.SIGNAL.ITEM_ADDED, this, p_glyphVariant);
        p_subFamily.Broadcast(SIGNAL.GLYPH_ADDED, this, p_glyphVariant);

    }

    RemoveVariant(p_subFamily) {
        if (!this._glyphVariants.Remove(p_subFamily)) { return null; }
        let glyphVariant = this._subFamiliesMap.Get(p_subFamily);
        glyphVariant.subFamily = null;
        glyphVariant.Unwatch(com.SIGNAL.UPDATED, this._OnGlyphVariantUpdated, this);

        this.Broadcast(com.SIGNAL.ITEM_REMOVED, this, glyphVariant);

        p_subFamily.Broadcast(SIGNAL.GLYPH_REMOVED, this, glyphVariant);
        return this._subFamiliesMap.Get(p_subFamily);
    }

    _OnGlyphVariantUpdated(p_glyphVariant) {
        this.Broadcast(SIGNAL.VARIANT_UPDATED, this, p_glyphVariant);
    }

    GetVariant(p_subFamily) {
        let variant = this._subFamiliesMap.Get(p_subFamily);
        if (!variant) { variant = this._defaultGlyph; }
        return variant;
    }

    //

    //

    _OnSubFamilyReleased(p_subFamily) {
        let glyphVariant = this._subFamiliesMap.Get(p_subFamily);
        if (glyphVariant) {
            this._subFamiliesMap.Remove(p_subFamily);
            glyphVariant.Release();
        }
    }

    _OnSubFamilyValueUpdated(p_subFamily, p_id, p_valueObj, p_oldValue) {
        let glyphVariant;
        if (p_subFamily._isDefault) {
            // Forward update to all
            for (let i = 0, n = this._glyphVariants.count; i < n; i++) {
                glyphVariant = this.GetVariant(this._glyphVariants.At(i));
                glyphVariant._OnSubFamilyValueUpdated(p_subFamily, p_id, p_valueObj, p_oldValue);
            }
        } else {
            // Forward update only to mapped glyphVariant
            glyphVariant = this.GetVariant(p_subFamily);
            glyphVariant._OnSubFamilyValueUpdated(p_subFamily, p_id, p_valueObj, p_oldValue);
        }
    }

    _CleanUp() {
        this.family = null;
        this._unicode = null;
        this._unicodeInfos = null;
        super._CleanUp();
    }


}

module.exports = GlyphDataBlock;