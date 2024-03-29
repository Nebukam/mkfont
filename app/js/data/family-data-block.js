'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const io = nkm.io;

const UNICODE = require(`../unicode`);
const SIGNAL = require(`../signal`);
const IDS = require(`./ids`);
const ENUMS = require(`./enums`);

const FontObjectData = require(`./font-object-data`);
const Glyph = require(`./glyph-data-block`);
const GlyphVariant = require(`./glyph-variant-data-block`);
const GlyphVariantMissing = require(`./glyph-missing-data-block`);
const ImportSettings = require(`./settings-import-data-block`);
const SearchSettings = require(`./settings-search-data-block`);
const LigaImportSettings = require(`./settings-liga-import-data-block`);

const ContentManager = require(`../content-manager`);
const FamilyFontCache = require(`./family-font-cache`);
const GlyphVariantRef = require(`./glyph-variant-data-block-reference`);

const defaultEm = 1000;

const domparser = new DOMParser();
const svgFontString =
    `<font>` +
    `   <font-face>` +
    `       <font-face-src><font-face-src-name></font-face-src-name></font-face-src>` +
    `   </font-face>` +
    `</font>`;

const svgFontRef = domparser.parseFromString(svgFontString, `image/svg+xml`).getElementsByTagName(`font`)[0];


class FamilyDataBlock extends FontObjectData {
    constructor() { super(); }

    static __NFO__ = {
        [nkm.com.IDS.UID]: `@mkf:family-data-block`,
        [nkm.com.IDS.ICON]: `font`
    };

    static __VALUES = {

        [IDS.FAMILY]: { getter: () => { return nkm.settings.Get(IDS.FAMILY) } },
        [IDS.COPYRIGHT]: { getter: () => { return nkm.settings.Get(IDS.COPYRIGHT) } },
        [IDS.DESCRIPTION]: { getter: () => { return nkm.settings.Get(IDS.DESCRIPTION) } },
        [IDS.URL]: { getter: () => { return nkm.settings.Get(IDS.URL) } },
        [IDS.VERSION]: { value: `1.0` },
        [IDS.COLOR_PREVIEW]: { getter: () => { return nkm.settings.Get(IDS.COLOR_PREVIEW) } },

        //[IDS.ALPHABETIC]:{ value: 0 },
        //[IDS.MATHEMATICAL]:{ value: 350 },
        //[IDS.IDEOGRAPHIC]:{ value: 400 },

        [IDS.PREVIEW_SIZE]: { getter: () => { return nkm.settings.Get(IDS.PREVIEW_SIZE) } },

        [IDS.WEIGHT_CLASS]: { value: ENUMS.WEIGHTS.At(3).value },
        [IDS.FONT_STYLE]: { value: `Regular` },

        [IDS.EM_UNITS]: { value: defaultEm, propagate: true },
        [IDS.EM_RESAMPLE]: { value: true },
        [IDS.BASELINE]: { value: defaultEm * 0.8, propagate: true },
        [IDS.ASCENT]: { value: defaultEm * 0.8, propagate: true },
        [IDS.ASC_RESAMPLE]: { value: false },
        [IDS.DESCENT]: { value: defaultEm * -0.25, propagate: true },

        [IDS.CAP_HEIGHT]: { value: defaultEm * 0.7, propagate: true },
        [IDS.X_HEIGHT]: { value: defaultEm * 0.7 * 0.72, propagate: true },

        //[IDS.H_ORIGIN_X]:{ value: 0 },
        //[IDS.H_ORIGIN_Y]:{ value: 0 },
        [IDS.WIDTH]: { value: 1000, propagate: true },
        //[IDS.V_ORIGIN_X]:{ value: 0 },
        //[IDS.V_ORIGIN_Y]:{ value: 0 },
        [IDS.HEIGHT]: { value: 1000, propagate: true },
        [IDS.MONOSPACE]: { value: false, propagate: true },
        [IDS.UNDERLINE_POSITION]: { value: null },
        [IDS.UNDERLINE_THICKNESS]: { value: null },
        //[IDS.HANGING]:{ value: 500 },

    };

    _Init() {

        super._Init();

        this._Bind(this._OnGlyphUnicodeChanged);
        this._Bind(this._OnGlyphVariantUpdated);
        this._Bind(this._OnGlyphUpdated);

        this._ResetSelectionPresets();

        this._transformSettings = nkm.com.Rent(ImportSettings);
        this._searchSettings = nkm.com.Rent(SearchSettings);
        this._searchSettings.family = this;

        this._glyphs = [];
        this._glyphsMap = {};
        this._ligatureSet = new Set();
        this._glyphUnicodeCache = [];

        this._nullGlyph = new Glyph();
        this._nullGlyph.family = this;
        this._nullGlyph.isNull = true;
        this._nullGlyph._defaultGlyph._fontObject.remove();



        Glyph.__defaultVariantClass = GlyphVariantRef;
        this._refGlyph = new Glyph();
        this._refGlyph.family = this;
        this._refGlyph.isNull = true;
        this._refGlyph._defaultGlyph._fontObject.remove();

        Glyph.__defaultVariantClass = GlyphVariantMissing;
        this._missingGlyph = new Glyph();
        this._missingGlyph.family = this;
        this._missingGlyph.activeVariant.Set(IDS.PATH_DATA, SVGOPS.EmptySVGStats());

        Glyph.__defaultVariantClass = GlyphVariant;

        //

        this._ligaSettings = nkm.com.Rent(LigaImportSettings);

        //

        this._fontCache = new FamilyFontCache(this);

        //

        this._contextInfos = {
            raw: 1,
            rah: 1,
            w: 1000,
            h: 1000,
            rh: 1000,
            asc: 1000,
            bsl: 1000,
            dsc: 0,
            ref: 1000,
            xh: 1000,
            ch: 1000,
            em: 1000,
            xshift: 0,
            xpush: 0,
            mono: false
        }

        this._family = null;

        this._transformSettings = new ImportSettings();
        this._transformSettings.Watch(nkm.com.SIGNAL.VALUE_CHANGED, this._OnTransformValueChanged, this);

        this._delayedUpdateReferences = nkm.com.DelayedCall(this._Bind(this._UpdateLayerReferences));

    }

    Wake() {
        this._id = nkm.data.ID.New(`New MKFont`);
    }

    _BuildFontObject() { return svgFontRef.cloneNode(true); }

    get nullGlyph() { return this._nullGlyph; }
    get refGlyph() { return this._refGlyph; }

    get transformSettings() { return this._transformSettings; }
    get searchSettings() { return this._searchSettings; }

    //#region Glyph management

    AddGlyph(p_glyph) {

        if (!this._glyphs.AddNew(p_glyph)) { return; }

        let unicode = p_glyph.Get(IDS.UNICODE);
        if (unicode in this._glyphsMap) {
            throw new Error(`Glyph already registered with unicode @${unicode}`);
        }

        p_glyph.family = this;

        if (unicode) {
            this._glyphsMap[unicode] = p_glyph;
            if (p_glyph.isLigature) { this._ligatureSet.add(p_glyph); }
            this._glyphUnicodeCache.push(unicode);
        }

        p_glyph
            .Watch(SIGNAL.UNICODE_CHANGED, this._OnGlyphUnicodeChanged)
            .Watch(SIGNAL.VARIANT_UPDATED, this._OnGlyphVariantUpdated)
            .Watch(nkm.com.SIGNAL.UPDATED, this._OnGlyphUpdated);

        this._scheduledObjectUpdate.Bump();

        this.Broadcast(SIGNAL.GLYPH_ADDED, this, p_glyph);
        p_glyph._OnGlyphAddedToFamily(this);
        //ContentManager.Broadcast(SIGNAL.GLYPH_ADDED, p_glyph);

        //Need a way to find which layer might be referencing this glyph
        this._delayedUpdateReferences.Schedule();

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

        this._scheduledObjectUpdate.Bump();

        this.Broadcast(SIGNAL.GLYPH_REMOVED, this, g);
        g._OnGlyphRemovedFromFamily(this);
        //ContentManager.Broadcast(SIGNAL.GLYPH_REMOVED, g);

        this._delayedUpdateReferences.Schedule();

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

    _OnGlyphUnicodeChanged(p_glyph, p_newValue, p_oldValue) {

        let index = this._glyphUnicodeCache.indexOf(p_oldValue);

        if (index != -1) { this._glyphUnicodeCache[index] = unicode; }
        else { this._glyphUnicodeCache.push(unicode); }

        delete this._glyphsMap[p_oldValue];
        this._glyphsMap[p_newValue] = p_glyph;
        if (p_glyph.isLigature) { this._ligatureSet.add(p_glyph); }
        else { this._ligatureSet.delete(p_glyph); }

        this._scheduledObjectUpdate.Bump();

    }

    _OnGlyphUpdated() { this._scheduledUpdate.Schedule(); }

    _OnGlyphVariantUpdated(p_glyph, p_glyphVariant) {
        this._scheduledUpdate.Schedule();
    }

    //#endregion

    //#region properties update

    CommitUpdate() {
        if (this._id) { this._id.name = `${this.Get(IDS.FAMILY)}-${this.Get(IDS.FONT_STYLE)}`; }
        super.CommitUpdate();
    }

    CommitValueUpdate(p_id, p_newValue, p_oldValue, p_silent = false) {
        super.CommitValueUpdate(p_id, p_newValue, p_oldValue, p_silent);

        let
            descriptor = nkm.data.GetDescriptor(p_id),
            definition = this.DEFINITIONS[p_id];

        if (!descriptor || !descriptor.recompute || !definition.propagate) { return; }
        for (const g of this._glyphs) { g._PushUpdate(); }
    }

    _OnTransformValueChanged(p_data, p_id, p_newValue, p_oldValue) {

        let
            descriptor = nkm.data.GetDescriptor(p_id),
            definition = this.DEFINITIONS[p_id];

        if (!descriptor || !descriptor.recompute || !definition.propagate) { return; }
        this._UpdateDisplayValues();

        // TODO : This can be greatly optimized by only propagating to glyphs that have the associated property == null
        for (const g of this._glyphs) {
            for (const v of g._variants) {
                if (v._transformSettings._values[p_id] == null) { v._transformSettings.CommitUpdate(); }
            }
        }
    }

    _UpdateLayerReferences() {

        for (const g of this._glyphs) {
            for (const v of g._variants) {
                for (const lyr of v._layers) {
                    if (!lyr.importedVariant) { lyr._RetrieveGlyphInfos(); }
                };
            };
        };
    }

    _UpdateFontObject() {

        let
            font = this._fontObject,

            fontFace = font.getElementsByTagName(`font-face`)[0],
            fontFaceSrc = font.getElementsByTagName(`font-face-src`)[0],
            fontFaceSrcName = font.getElementsByTagName(`font-face-src-name`)[0],
            missingGlyph = font.getElementsByTagName(`missing-glyph`)[0],

            fullName = `${this.Resolve(IDS.FAMILY)}-${this.Resolve(IDS.FONT_STYLE)}`;

        font.setAttribute(IDS.ID, fullName);
        font.setAttribute(SVGOPS.ATT_H_ADVANCE, this.Resolve(IDS.WIDTH));
        font.setAttribute(SVGOPS.ATT_V_ADVANCE, this.Resolve(IDS.HEIGHT));

        fontFaceSrcName.setAttribute(`name`, fullName);

        fontFace.setAttribute(SVGOPS.ATT_ASCENT, this.Get(IDS.BASELINE));
        fontFace.setAttribute(SVGOPS.ATT_DESCENT, this.Get(IDS.DESCENT));
        fontFace.setAttribute(SVGOPS.ATT_EM_UNITS, this.Get(IDS.EM_UNITS));
        fontFace.setAttribute(SVGOPS.ATT_WEIGHT_CLASS, this.Get(IDS.WEIGHT_CLASS));
        fontFace.setAttribute('font-stretch', 'normal');

    }

    _UpdateDisplayValues() {

        let
            fw = this.Resolve(IDS.WIDTH),
            fh = this.Resolve(IDS.HEIGHT),
            bsl = this.Resolve(IDS.BASELINE),
            asc = this.Resolve(IDS.ASCENT),
            dsc = this.Resolve(IDS.DESCENT),
            em = this.Resolve(IDS.EM_UNITS),
            xh = this.Resolve(IDS.X_HEIGHT),
            ch = this.Resolve(IDS.CAP_HEIGHT),
            h = asc - dsc,
            offy = Math.min(bsl - asc, 0),
            rh = Math.max(em, h),
            sc = 1,
            ratio_w = 1,
            ratio_h = 1,
            ref = 0;

        if (fw > rh) {
            //font wider than taller
            ref = fw;
            ratio_w = ref / rh;
        } else {
            //font taller than wider
            ref = rh;
            ratio_h = ref / fw;
        }

        this._contextInfos.raw = ratio_w;
        this._contextInfos.rah = ratio_h;
        this._contextInfos.w = fw;
        this._contextInfos.h = fh;
        this._contextInfos.offy = offy;
        this._contextInfos.rh = rh;
        this._contextInfos.bsl = bsl;
        this._contextInfos.asc = asc;
        this._contextInfos.dsc = dsc;
        this._contextInfos.xh = xh;
        this._contextInfos.ch = ch;
        this._contextInfos.ref = ref;
        this._contextInfos.em = em;
        this._contextInfos.xshift = this._transformSettings.Get(IDS.TR_WIDTH_SHIFT);
        this._contextInfos.xpush = this._transformSettings.Get(IDS.TR_WIDTH_PUSH);
        this._contextInfos.mono = this.Resolve(IDS.MONOSPACE);

    }

    //#endregion

    HasCircularDep(p_target, p_candidate) {

        if (!p_candidate || !p_target) { return false; }
        if (p_target == p_candidate) { return true; }
        if (p_candidate._layers.isEmpty) { return false; }

        let tempSet = new Set(),
            result = this._HasCircularDep(p_target, p_candidate, tempSet);

        tempSet.clear();
        tempSet = null;

        return result;

    }

    _HasCircularDep(p_target, p_candidate, p_set) {

        if (p_set.has(p_candidate)) { return false; }
        p_set.add(p_candidate);

        if (!p_candidate || !p_target) { return false; }
        if (p_target == p_candidate) { return true; }
        if (p_candidate._layers.isEmpty) { return false; }

        let layers = p_candidate._layers;

        for (let i = 0, n = layers.length; i < n; i++) {
            let layer = layers[i];
            if (this._HasCircularDep(p_target, layer.importedVariant, p_set)) { return true; }
        }

        return false;
    }

    _OnReset(p_individualSet, p_silent) {

        this._transformSettings.Reset(p_individualSet, p_silent);
        this._searchSettings.Reset(p_individualSet, p_silent);

        for (var p in this._transformSettings._values) {
            delete this._transformSettings._values[p].nullable;
        }

        console.log(`_OnReset global transforms data block`);
        super._OnReset();
    }

    _ResetSelectionPresets() {
        this._selectionPresets = [];
        for (let i = 0; i < 10; i++) { this._selectionPresets.push(null); }
    }

    _CleanUp() {

        //TODO : Cleanup up subFamilies, glyphs, and their variant

        this._ResetSelectionPresets();

        while (this._glyphs.length) {
            let g = this._glyphs.last;
            this.RemoveGlyph(g);
            g.Release();
        }

        this._nullGlyph.Reset(false, true);
        this._nullGlyph._defaultGlyph.Reset(false, true);
        this._nullGlyph._defaultGlyph._ClearLayers();

        this._refGlyph.Reset(false, true);
        this._refGlyph._defaultGlyph.Reset(false, true);
        this._refGlyph._defaultGlyph._ClearLayers();

        this._searchSettings.Reset(false, true);

        /////
        this._glyphs.length = 0;
        this._glyphsMap = {};
        this._ligatureSet.clear();
        this._glyphUnicodeCache.length = 0;

        this._fontCache.Clear();

        super._CleanUp();
    }


}

module.exports = nkm.data.Register(FamilyDataBlock);