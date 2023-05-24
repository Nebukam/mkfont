'use strict';

const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const u = nkm.u;
const io = nkm.io;

const UNICODE = require(`../unicode`);

const FontObjectData = require(`./font-object-data`);
const SIGNAL = require(`../signal`);
const IDS = require(`./ids`);

const GlyphVariant = require(`./glyph-variant-data-block`);

class GlyphDataBlock extends FontObjectData {

    constructor() { super(); }

    static __defaultVariantClass = GlyphVariant;

    static __VALUES = {
        [IDS.GLYPH_NAME]: { value: '' },
        [IDS.UNICODE]: { value: null, signal: SIGNAL.UNICODE_CHANGED },
        //[IDS.DO_EXPORT]:{ value: true },
    }

    _Init() {

        super._Init();

        this._family = null;
        this._arabic_form = null;
        this._unicodeInfos = null;

        this._variants = new nkm.collections.List();

        this._defaultGlyph = new this.constructor.__defaultVariantClass();
        this._defaultGlyph._isDefault = true;
        this.AddVariant(this._defaultGlyph);

    }

    get resolutionFallbacks() { return [this._family]; }

    get activeVariant() { return this._defaultGlyph; }

    get isLigature() {
        let unc = this._values[IDS.UNICODE];
        return unc ? unc.includes(`+`) ? true : false : false;
    }

    get family() { return this._family; }
    set family(p_value) {
        if (this._family == p_value) { return; }
        let oldFamily = this._family;
        this._family = p_value;

        for (let i = 0; i < this._variants.count; i++) { this._variants.At(i).family = p_value; }
    }

    get variantsCount() { return this._variants.count; }

    get unicodeInfos() {
        if (!this._unicodeInfos) { return UNICODE.GetInfos(this.Get(IDS.UNICODE), true); }
        return this._unicodeInfos;
    }
    set unicodeInfos(p_value) { this._unicodeInfos = p_value; }

    // Variant management

    AddVariant(p_glyphVariant = null) {
        if (p_glyphVariant != null) { if (this._variants.Contains(p_glyphVariant)) { return p_glyphVariant; } }
        else { p_glyphVariant = com.Rent(this.constructor.__defaultVariantClass); }
        this._variants.Add(p_glyphVariant);
        p_glyphVariant.index = this._variants.count - 1;
        this._OnGlyphVariantAdded(p_glyphVariant);
        return p_glyphVariant;
    }

    _OnGlyphVariantAdded(p_glyphVariant) {
        p_glyphVariant.glyph = this;
        p_glyphVariant.family = this._family;
        p_glyphVariant.Watch(com.SIGNAL.UPDATED, this._OnGlyphVariantUpdated, this);
        this.Broadcast(com.SIGNAL.ITEM_ADDED, this, p_glyphVariant);
    }

    RemoveVariant(p_glyphVariant) {
        if (p_glyphVariant == this._defaultGlyph) { return null; }
        if (!this._variants.Remove(p_glyphVariant)) { return null; }
        this._OnGlyphVariantRemoved(p_glyphVariant);
        return p_glyphVariant;
    }

    _OnGlyphVariantRemoved(p_glyphVariant) {
        p_glyphVariant.glyph = null;
        p_glyphVariant.family = null;
        p_glyphVariant.Unwatch(com.SIGNAL.UPDATED, this._OnGlyphVariantUpdated, this);
        this._variants.ForEach((item, i) => { item.index = i; });
        this.Broadcast(com.SIGNAL.ITEM_REMOVED, this, p_glyphVariant);
    }

    _OnGlyphVariantUpdated(p_glyphVariant) {
        this.Broadcast(SIGNAL.VARIANT_UPDATED, this, p_glyphVariant);
    }

    GetVariant(p_index = 0) {
        let variant = this._variants.At(p_index);
        if (!variant) { variant = this._defaultGlyph; }
        return variant;
    }

    //

    _OnGlyphAddedToFamily(p_family) {
        this.Broadcast(SIGNAL.GLYPH_ADDED, this);
    }

    _OnGlyphRemovedFromFamily(p_family) {
        this.Broadcast(SIGNAL.GLYPH_REMOVED, this);
        // Disconnect variant users
        this._variants.ForEach((item, i) => {
            for (let i = 0, n = item._layerUsers.count; i < n; i++) {
                let user = item._layerUsers.last;
                user.importedVariant = null;
            }
        });
    }

    //

    _PushUpdate() {
        this._variants.ForEach((item, i) => { item._PushUpdate(); });
    }

    _CleanUp() {

        this.family = null;

        let v = this._variants.last;

        while (v != null) {
            v = this.RemoveVariant(this._variants.last);
            if (v) { v.Release(); }
        }

        this._defaultGlyph.Reset(false, true); // will clear SVG stuff since family == null
        this._defaultGlyph._ClearLayers();

        this._unicode = null;
        this._unicodeInfos = null;

        super._CleanUp();

    }


}

module.exports = nkm.data.Register(GlyphDataBlock);