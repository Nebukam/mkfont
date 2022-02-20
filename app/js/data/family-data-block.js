'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const io = nkm.io;

const SIGNAL = require(`./signal`);
const IDS = require(`./ids`);

const Slot = require(`./slot-catalog-item`);
const SubFamily = require(`./sub-family-data-block`);

class FamilyDataBlock extends nkm.data.SimpleDataBlock {

    constructor() { super(); }

    _Init() {

        super._Init();

        this._values = {
            [IDS.FAMILY]: { value: `MKFamily` },
            [IDS.METADATA]: { value: `...` },
            [IDS.COPYRIGHT]: { value: null },
            [IDS.DESCRIPTION]: { value: `` },
            [IDS.URL]: { value: `` },
            [IDS.VERSION]: { value: `0.0.1` },
            [IDS.COLOR_PREVIEW]: { value: `#f5f5f5` },
        };

        this._glyphs = new nkm.collections.List();

        this._catalog = nkm.data.catalogs.CreateFrom({ name: `glyphs` });

        this._subFamilies = new nkm.collections.List();
        this._defaultSubFamily = new SubFamily();
        this._defaultSubFamily._isDefault = true;

        this._viewBox = { x: 0, y: 0, width: 100, height: 100 };

        this._selectedSubFamily = this._defaultSubFamily;

        // Family data : only holds Glyph data.
        // The editor is responsible for making the "connection" between
        // which glyph belong to which group/foldout and distribute UI elements
        // accordingly.

    }

    _PostInit() {
        super._PostInit();
        this.AddSubFamily(this._defaultSubFamily);
    }

    get catalog() { return this._catalog; }

    get defaultSubFamily() { return this._defaultSubFamily; }

    get selectedSubFamily() { return this._selectedSubFamily; }
    set selectedSubFamily(p_value) {
        if (!p_value) { p_value = this._defaultSubFamily; }
        this._selectedSubFamily = p_value;
        this._Broadcast(SIGNAL.SUBFAMILY_CHANGED, this._selectedSubFamily);
    }

    get viewBox() { return this._viewBox; }
    set viewBox(p_value) {
        this._viewBox = p_value;
        // Dispatch viewBox update evt
    }

    AddSubFamily(p_subFamily) {
        if (!this._subFamilies.Add(p_subFamily)) { return; }
        p_subFamily.family = this;
        for (let i = 0, n = this._glyphs.count; i < n; i++) {
            let g = this._glyphs.At(i);
            g.AddVariant(p_subFamily);
        }
    }

    RemoveSubFamily(p_subFamily) {
        if (!this._subFamilies.Remove(p_subFamily)) { return; }
        for (let i = 0, n = this._glyphs.count; i < n; i++) {
            let g = this._glyphs.At(i);
            g.RemoveVariant(p_subFamily);
        }
    }

    AddGlyph(p_glyph) {
        p_glyph.family = this;
        if (!this._glyphs.Add(p_glyph)) { return; }

        let unicode = p_glyph.unicode,
            slot = this._GetSlot(unicode),
            slotData = slot.data;

        if (slotData && slotData != p_glyph) {
            // Glyph data conflicts with existing glyph :o
        } else {
            slot.data = p_glyph;
        }

        p_glyph
            .Watch(SIGNAL.UNICODE_CHANGED, this._OnGlyphUnicodeChanged)
            .Watch(SIGNAL.VARIANT_UPDATED, this._OnGlyphVariantUpdated);

        for (let i = 0, n = this._subFamilies.count; i < n; i++) {
            let subFamily = this._subFamilies.At(i);
            if (subFamily == this._defaultSubFamily) { p_glyph._SetDefaultVariant(subFamily); }
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
            .Unwatch(SIGNAL.VARIANT_UPDATED, this._OnGlyphVariantUpdated);

        this._Broadcast(nkm.com.SIGNAL.ITEM_REMOVED, this, g);
    }

    _OnGlyphUnicodeChanged() {
        // TODO : Move from old slot to the new one
    }

    _OnGlyphVariantUpdated(p_glyph, p_glyphVariant) {

    }

    _GetSlot(p_unicode) {
        // Get or create slot matching a given unicode value
        let slot = this._catalog.FindFirstByOptionValue(`unicode`, p_unicode);
        if (slot) { return slot; }
        let slotOptions = { unicode: p_unicode, itemClass: Slot };
        slot = this._catalog.Register(slotOptions);
        return slot;
    }

    _CleanUp() {
        super._CleanUp();
    }


}

module.exports = FamilyDataBlock;