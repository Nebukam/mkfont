'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const io = nkm.io;

const SIGNAL = require(`./signal`);
const IDS = require(`./ids`);

const SimpleDataEx = require(`./simple-data-ex`);
const Slot = require(`./slot-catalog-item`);
const SubFamily = require(`./sub-family-data-block`);

class FamilyDataBlock extends SimpleDataEx {

    constructor() { super(); }

    _Init() {

        super._Init();

        this._Bind(this._OnGlyphUnicodeChanged);
        this._Bind(this._OnGlyphVariantUpdated);
        this._Bind(this._OnGlyphUpdated);


        this._values = {
            [IDS.FAMILY]: { value: `Font Family Name` },
            [IDS.COPYRIGHT]: { value: `` },
            [IDS.DESCRIPTION]: { value: `` },
            [IDS.URL]: { value: `` },
            [IDS.VERSION]: { value: `1.0` },
            [IDS.COLOR_PREVIEW]: { value: `#f5f5f5` },

            [IDS.ALPHABETIC]: { value: 0 },
            [IDS.MATHEMATICAL]: { value: 350 },
            [IDS.IDEOGRAPHIC]: { value: 400 },

            [IDS.RATIO_H]: { value: 1 },
            [IDS.RATIO_V]: { value: 1 },
            [IDS.PREVIEW_SIZE]: { value: 50 },
        };

        this._glyphs = new nkm.collections.List();

        this._catalog = nkm.data.catalogs.CreateFrom({ name: `Glyphs` });
        this._subFamiliesCatalog = nkm.data.catalogs.CreateFrom({ name:'Sub Families' });

        this._subFamilies = new nkm.collections.List();
        this._defaultSubFamily = new SubFamily();
        this._defaultSubFamily._isDefault = true;

        this._selectedSubFamily = this._defaultSubFamily;
        

    }

    _PostInit() {
        super._PostInit();
        this.AddSubFamily(this._defaultSubFamily);
    }

    get catalog() { return this._catalog; }

    get defaultSubFamily() { return this._defaultSubFamily; }

    // Subfamily management

    get selectedSubFamily() { return this._selectedSubFamily; }
    set selectedSubFamily(p_value) {
        if (!p_value) { p_value = this._defaultSubFamily; }
        this._selectedSubFamily = p_value;
        this._Broadcast(SIGNAL.SUBFAMILY_CHANGED, this._selectedSubFamily);
    }

    AddSubFamily(p_subFamily) {
        if (!this._subFamilies.Add(p_subFamily)) { return; }

        p_subFamily.family = this;
        p_subFamily.Watch(nkm.data.SIGNAL.VALUE_CHANGED, this._OnSubFamilyValueUpdated, this);

        for (let i = 0, n = this._glyphs.count; i < n; i++) {
            let g = this._glyphs.At(i);
            g.AddVariant(p_subFamily);
        }

        let catalogItem = this._subFamiliesCatalog.Register({ name:`default`, data:p_subFamily });
        p_subFamily._catalogItem = catalogItem;
    }

    RemoveSubFamily(p_subFamily) {
        if (!this._subFamilies.Remove(p_subFamily)) { return; }

        p_subFamily.Unwatch(nkm.data.SIGNAL.VALUE_CHANGED, this._OnSubFamilyValueUpdated, this);

        for (let i = 0, n = this._glyphs.count; i < n; i++) {
            let g = this._glyphs.At(i);
            g.RemoveVariant(p_subFamily);
        }

        let item = this._subFamiliesCatalog.FindFirstDataHolder(p_subFamily, false);
        item.Release();
    }

    // Glyph management

    AddGlyph(p_glyph) {
        p_glyph.family = this;
        if (!this._glyphs.Add(p_glyph)) { return; }

        let
            slot = this._GetSlot(p_glyph.Get(IDS.UNICODE)),
            slotData = slot.data;

        if (slotData && slotData != p_glyph) {
            // Glyph data conflicts with existing glyph :o
        } else {
            slot.data = p_glyph;
        }

        p_glyph
            .Watch(SIGNAL.UNICODE_CHANGED, this._OnGlyphUnicodeChanged)
            .Watch(SIGNAL.VARIANT_UPDATED, this._OnGlyphVariantUpdated)
            .Watch(nkm.com.SIGNAL.UPDATED, this._OnGlyphUpdated);

        for (let i = 0, n = this._subFamilies.count; i < n; i++) {
            let subFamily = this._subFamilies.At(i);
            if (subFamily._isDefault) { p_glyph._SetDefaultVariant(subFamily); }
            else { p_glyph.AddVariant(subFamily); }
        }

        this._Broadcast(nkm.com.SIGNAL.ITEM_ADDED, this, p_glyph);
    }

    RemoveGlyph(p_glyph) {
        let g = this._glyphs.Remove(p_glyph);
        if (!g) { return; }

        let slot = this._catalog.FindFirstDataHolder(p_glyph, false);
        slot.data = null;
        //TODO : If custom slot, release it.

        p_glyph
            .Unwatch(SIGNAL.UNICODE_CHANGED, this._OnGlyphUnicodeChanged)
            .Unwatch(SIGNAL.VARIANT_UPDATED, this._OnGlyphVariantUpdated)
            .Unwatch(nkm.com.SIGNAL.UPDATED, this._OnGlyphUpdated);

        this._Broadcast(nkm.com.SIGNAL.ITEM_REMOVED, this, g);

    }

    _GetSlot(p_unicode) {
        // Get or create slot matching a given unicode value
        let slot = this._catalog.FindFirstByOptionValue(`unicode`, p_unicode);
        if (slot) { return slot; }
        let slotOptions = { unicode: p_unicode, itemClass: Slot };
        slot = this._catalog.Register(slotOptions);
        return slot;
    }

    // Watch

    _OnGlyphUnicodeChanged() {
        // TODO : Move from old slot to the new one
    }

    _OnGlyphUpdated() {
        this._scheduledUpdate.Schedule();
    }

    _OnGlyphVariantUpdated(p_glyph, p_glyphVariant) {
        p_glyphVariant.subFamily._scheduledUpdate.Schedule();
        this._scheduledUpdate.Schedule();
    }

    _OnSubFamilyValueUpdated(p_subFamily, p_valueObj) {
        for (let i = 0, n = this._glyphs.count; i < n; i++) {
            let g = this._glyphs.At(i);
            g._OnSubFamilyValueUpdated(p_subFamily, p_valueObj);
        }
        this._scheduledUpdate.Schedule();
    }


}

module.exports = FamilyDataBlock;