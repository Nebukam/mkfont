'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.utils;
const io = nkm.io;

const SimpleDataEx = require(`./simple-data-ex`);
const SIGNAL = require(`../signal`);
const IDS = require(`./ids`);
const ENUMS = require(`./enums`);
const ImportSettings = require(`./settings-import-data-block`);

const domparser = new DOMParser();
const svgFontString =
    `<font>` +
    `   <font-face>` +
    `       <font-face-src><font-face-src-name></font-face-src-name></font-face-src>` +
    `   </font-face>` +
    `   <missing-glyph></missing-glyph>` +
    `</font>`;

const svgFontRef = domparser.parseFromString(svgFontString, `image/svg+xml`).getElementsByTagName(`font`)[0];


class SubFamilyDataBlock extends SimpleDataEx {

    constructor() { super(); }

    static NULL = new SubFamilyDataBlock();

    _Init() {

        super._Init();


        this._contextInfos = {
            raw: 1,
            rah: 1,
            w: 1000,
            h: 1000,
            rh: 1000,
            asc: 1000,
            dsc: 0,
            ref: 1000,
            em: 1000,
            mono: false
        }

        let defaultEm = 1000;

        this._values = {
            [IDS.WEIGHT_CLASS]: { value: ENUMS.WEIGHTS.At(3).value },
            [IDS.FONT_STYLE]: { value: `Regular` },

            [IDS.CAP_HEIGHT]: { value: null },
            [IDS.X_HEIGHT]: { value: null },

            [IDS.EM_UNITS]: { value: defaultEm },
            [IDS.EM_RESAMPLE]: { value: true },
            [IDS.ASCENT]: { value: defaultEm * 0.8 },
            [IDS.ASC_RESAMPLE]: { value: true },
            [IDS.DESCENT]: { value: defaultEm * -0.25 },
            //[IDS.H_ORIGIN_X]: { value: 0 },
            //[IDS.H_ORIGIN_Y]: { value: 0 },
            [IDS.WIDTH]: { value: 1000 },
            //[IDS.V_ORIGIN_X]: { value: 0 },
            //[IDS.V_ORIGIN_Y]: { value: 0 },
            [IDS.HEIGHT]: { value: 1000 },
            [IDS.MONOSPACE]: { value: false },
            [IDS.UNDERLINE_POSITION]: { value: null },
            [IDS.UNDERLINE_THICKNESS]: { value: null },
            //[IDS.HANGING]: { value: 500 },

        };

        this._family = null;
        this._ttfBytes = null;

        this._transformSettings = new ImportSettings();
        this._transformSettings.Watch(nkm.data.SIGNAL.VALUE_CHANGED, this._OnTransformSettingsUpdated, this);

        this._globalTransforms = new ImportSettings();
        this._globalTransforms.Watch(nkm.data.SIGNAL.VALUE_CHANGED, this._OnTransformSettingsUpdated, this);

        this._catalogItem = null;

    }

    _BuildFontObject() { return svgFontRef.cloneNode(true); }

    get transformSettings() { return this._transformSettings; }

    get resolutionFallbacks() { return [this._family.defaultSubFamily, this._family]; }

    get family() { return this._family; }
    set family(p_value) {

        if (this._family == p_value) { return; }

        let oldFamily = this._family;
        this._family = p_value;

        if (oldFamily) { oldFamily.Unwatch(nkm.data.SIGNAL.VALUE_CHANGED, this._OnFamilyValueChanged, this); }
        if (this._family) { this._family.Watch(nkm.data.SIGNAL.VALUE_CHANGED, this._OnFamilyValueChanged, this); }

    }

    _OnFamilyValueChanged(p_data, p_id, p_valueObj) {
        //this._scheduledUpdate.Schedule();
    }

    _UpdateFontObject() {

        let
            font = this._fontObject,

            fontFace = font.getElementsByTagName(`font-face`)[0],
            fontFaceSrc = font.getElementsByTagName(`font-face-src`)[0],
            fontFaceSrcName = font.getElementsByTagName(`font-face-src-name`)[0],
            missingGlyph = font.getElementsByTagName(`missing-glyph`)[0],

            fullName = `${this.Resolve(IDS.FAMILY)}-${this.Resolve(IDS.FONT_STYLE)}`;

        dom.SAtt(font, IDS.ID, fullName, true);
        dom.SAtt(font, IDS.WIDTH, this.Resolve(IDS.WIDTH), true);
        dom.SAtt(font, IDS.HEIGHT, this.Resolve(IDS.HEIGHT), true);

        dom.SAtt(fontFaceSrcName, `name`, fullName, true);

        dom.SAtt(fontFace, this._values, `value`, true);

        dom.SAtt(fontFace, IDS.WEIGHT_CLASS, this.Get(IDS.WEIGHT_CLASS).value, true);

        if (this._catalogItem) { this._catalogItem.name = fullName; }

    }

    _UpdateDisplayValues() {

        let
            fw = this.Resolve(IDS.WIDTH),
            fh = this.Resolve(IDS.HEIGHT),
            asc = this.Resolve(IDS.ASCENT),
            dsc = this.Resolve(IDS.DESCENT),
            em = this.Resolve(IDS.EM_UNITS),
            h = asc - dsc,
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
        this._contextInfos.rh = rh;
        this._contextInfos.asc = asc;
        this._contextInfos.dsc = dsc;
        this._contextInfos.ref = ref;
        this._contextInfos.em = em;
        this._contextInfos.mono = this.Resolve(IDS.MONOSPACE);

    }

    CommitValueUpdate(p_id, p_valueObj, p_oldValue, p_silent = false) {
        super.CommitValueUpdate(p_id, p_valueObj, p_oldValue, p_silent);
        let infos = IDS.GetInfos(p_id);
        if (infos && infos.recompute) { this._ScheduleGlyphUpdate(); }
    }

    _OnTransformSettingsUpdated(p_data, p_id, valueObj) {
        if ((`override` in valueObj)) {
            //Value is overridable, go through all glyphs and CommitUpdate the one who aren't overriding the value
            let list = this._family._glyphs.internalArray;
            for (let i = 0; i < list.length; i++) {
                let glyphVariant = list[i].GetVariant(this);
                if (!glyphVariant.transformSettings._values[p_id].override) {
                    glyphVariant._ScheduleTransformationUpdate();
                }
            }
        }
    }

    _ScheduleGlyphUpdate() {
        let list = this._family._glyphs.internalArray;
        for (let i = 0; i < list.length; i++) {
            list[i].GetVariant(this)._ScheduleTransformationUpdate();
        }
    }

    CommitUpdate() {
        this._UpdateDisplayValues();
        super.CommitUpdate();
    }

}

module.exports = SubFamilyDataBlock;