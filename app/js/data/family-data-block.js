'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const io = nkm.io;

const UNICODE = require(`../unicode`);
const SIGNAL = require(`../signal`);
const IDS = require(`./ids`);

const SimpleDataEx = require(`./simple-data-ex`);
const SubFamily = require(`./sub-family-data-block`);
const Glyph = require(`./glyph-data-block`);
const GlyphVariant = require(`./glyph-variant-data-block`);
const GlyphVariantMissing = require(`./glyph-missing-data-block`);
const ImportSettings = require(`./settings-import-data-block`);
const SearchSettings = require(`./settings-search-data-block`);

const ContentUpdater = require(`../content-updater`);

class FamilyDataBlock extends SimpleDataEx {
    constructor() { super(); }

    static __NFO__ = {
        [nkm.com.IDS.UID]: `@mkf:family-data-block`,
        [nkm.com.IDS.ICON]: `data-block`
    };

    _Init() {

        super._Init();

        this._Bind(this._OnGlyphUnicodeChanged);
        this._Bind(this._OnGlyphVariantUpdated);
        this._Bind(this._OnGlyphUpdated);


        this._values = {
            [IDS.FAMILY]: { value: `Font Family Name` },
            [IDS.COPYRIGHT]: { value: `(c) mkfont 2022` },
            [IDS.DESCRIPTION]: { value: `Made with mkfont` },
            [IDS.URL]: { value: `https://github.com/Nebukam/mkfont` },
            [IDS.VERSION]: { value: `1.0` },
            [IDS.COLOR_PREVIEW]: { value: `#f5f5f5` },

            [IDS.ALPHABETIC]: { value: 0 },
            [IDS.MATHEMATICAL]: { value: 350 },
            [IDS.IDEOGRAPHIC]: { value: 400 },

            [IDS.PREVIEW_SIZE]: { value: 70 },
        };

        this._transformSettings = nkm.com.Rent(ImportSettings);
        this._searchSettings = nkm.com.Rent(SearchSettings);
        this._searchSettings.family = this;

        this._glyphs = new nkm.collections.List();
        this._glyphsMap = {};
        this._ligatureSet = new Set();
        this._glyphUnicodeCache = [];

        this._subFamiliesCatalog = nkm.data.catalogs.CreateFrom({ name: 'Sub Families' });

        this._subFamilies = new nkm.collections.List();
        this._defaultSubFamily = new SubFamily();
        this._defaultSubFamily._isDefault = true;

        this._nullGlyph = new Glyph();
        this._nullGlyph.family = this;
        this._nullGlyph._SetDefaultVariant(this._defaultSubFamily);
        this._nullGlyph.isNull = true;
        this._nullGlyph._defaultGlyph._fontObject.remove();

        Glyph.__defaultVariantClass = GlyphVariantMissing;
        this._missingGlyph = new Glyph();
        Glyph.__defaultVariantClass = GlyphVariant;
        this._missingGlyph.family = this;
        this._missingGlyph._SetDefaultVariant(this._defaultSubFamily);
        this._missingGlyph.defaultGlyph.Set(IDS.PATH_DATA, SVGOPS.EmptySVGStats());

        this._selectedSubFamily = this._defaultSubFamily;

    }

    _PostInit() {
        super._PostInit();
        this.AddSubFamily(this._defaultSubFamily);
    }

    get nullGlyph() { return this._nullGlyph; }

    get transformSettings() { return this._transformSettings; }
    get searchSettings() { return this._searchSettings; }

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

        let catalogItem = this._subFamiliesCatalog.Register({ name: `default`, data: p_subFamily });
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

        let unicode = p_glyph.Get(IDS.UNICODE);
        if (unicode in this._glyphsMap) {
            throw new Error(`Glyph already registered with unicode @${unicode}`);
        }

        if (unicode) {
            this._glyphsMap[unicode] = p_glyph;
            if (p_glyph.isLigature) { this._ligatureSet.add(p_glyph); }
            this._glyphUnicodeCache.push(unicode);
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

        this._Broadcast(SIGNAL.GLYPH_ADDED, this, p_glyph);
        ContentUpdater.instance._Broadcast(SIGNAL.GLYPH_ADDED, p_glyph);

    }

    RemoveGlyph(p_glyph) {
        let g = this._glyphs.Remove(p_glyph);
        if (!g) { return; }

        let unicode = g.Get(IDS.UNICODE);

        delete this._glyphsMap[unicode];
        this._ligatureSet.delete(p_glyph);

        let index = this._glyphUnicodeCache.indexOf(unicode);
        if (index != -1) { this._glyphUnicodeCache.splice(index, 1); }

        //TODO : If custom slot, release it.

        p_glyph
            .Unwatch(SIGNAL.UNICODE_CHANGED, this._OnGlyphUnicodeChanged)
            .Unwatch(SIGNAL.VARIANT_UPDATED, this._OnGlyphVariantUpdated)
            .Unwatch(nkm.com.SIGNAL.UPDATED, this._OnGlyphUpdated);

        p_glyph.family = null;

        for (let i = 0, n = this._subFamilies.count; i < n; i++) {
            let glyphVariant = p_glyph.GetVariant(this._subFamilies.At(i));
            ContentUpdater.Push(glyphVariant, glyphVariant._UpdateFontObject);
        }

        this._Broadcast(SIGNAL.GLYPH_REMOVED, this, g);
        ContentUpdater.instance._Broadcast(SIGNAL.GLYPH_REMOVED, g);

    }

    /**
     * Get the glyph currently existing at the specified UNICODE location
     * otherwise returns nullGlyphL
     * @param {string} p_unicode 
     * @returns 
     */
    GetGlyph(p_unicode) {
        return this._glyphsMap[p_unicode] || this._nullGlyph;
    }

    /**
     * Attempts to find existing glyphs from UNICODE infos
     * otherwise returns nullGlyph
     * @param {*} p_infos 
     */
    TryGetGlyph(p_infos) {
        return this._glyphsMap[UNICODE.GetLookup(p_infos)] || this._nullGlyph;
    }

    // Watch

    _OnGlyphUnicodeChanged(p_glyph, p_valueObj, p_oldValue) {
        // TODO : Move from old slot to the new one
        let index = this._glyphUnicodeCache.indexOf(p_oldValue);

        if (index != -1) { this._glyphUnicodeCache[index] = unicode; }
        else { this._glyphUnicodeCache.push(unicode); }

        delete this._glyphsMap[p_oldValue];
        this._glyphsMap[p_valueObj.value] = p_glyph;
        if (p_glyph.isLigature) { this._ligatureSet.add(p_glyph); }
        else { this._ligatureSet.delete(p_glyph); }
    }

    _OnGlyphUpdated() {
        this._scheduledUpdate.Schedule();
    }

    _OnGlyphVariantUpdated(p_glyph, p_glyphVariant) {
        p_glyphVariant.subFamily._scheduledUpdate.Schedule();
        this._scheduledUpdate.Schedule();
    }

    _OnSubFamilyValueUpdated(p_subFamily, p_id, p_valueObj, p_oldValue) {
        let infos = IDS.GetInfos(p_id);
        if (!infos || !infos.recompute) { return; }
        for (let i = 0, n = this._glyphs.count; i < n; i++) {
            let g = this._glyphs.At(i);
            g._OnSubFamilyValueUpdated(p_subFamily, p_id, p_valueObj, p_oldValue);
        }
        this._scheduledUpdate.Schedule();
    }

    _Cleanup(){

        super._CleanUp();
    }


}

module.exports = FamilyDataBlock;