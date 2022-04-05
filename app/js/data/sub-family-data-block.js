'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.u;
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
            bsl: 1000,
            dsc: 0,
            ref: 1000,
            xh: 1000,
            ch: 1000,
            em: 1000,
            mono: false
        }

        this._family = null;
        this._ttfBytes = null;

        this._transformSettings = new ImportSettings();
        this._transformSettings.Watch(nkm.data.SIGNAL.VALUE_CHANGED, this._OnTransformSettingsUpdated, this);

        this._globalTransforms = new ImportSettings();
        this._globalTransforms.Watch(nkm.data.SIGNAL.VALUE_CHANGED, this._OnTransformSettingsUpdated, this);

        this._catalogItem = null;

    }

    _ResetValues(p_values) {

        let defaultEm = 1000;

        p_values[IDS.WEIGHT_CLASS] = { value: ENUMS.WEIGHTS.At(3).value };
        p_values[IDS.FONT_STYLE] = { value: `Regular` };

        p_values[IDS.EM_UNITS] = { value: defaultEm };
        p_values[IDS.EM_RESAMPLE] = { value: true };
        p_values[IDS.BASELINE] = { value: defaultEm * 0.8 };
        p_values[IDS.ASCENT] = { value: defaultEm * 0.8 };
        p_values[IDS.ASC_RESAMPLE] = { value: false };
        p_values[IDS.DESCENT] = { value: defaultEm * -0.25 };

        p_values[IDS.CAP_HEIGHT] = { value: defaultEm * 0.7 };
        p_values[IDS.X_HEIGHT] = { value: defaultEm * 0.7 * 0.72 };

        //p_values[IDS.H_ORIGIN_X] = { value: 0 };
        //p_values[IDS.H_ORIGIN_Y] = { value: 0 };
        p_values[IDS.WIDTH] = { value: 1000 };
        //p_values[IDS.V_ORIGIN_X] = { value: 0 };
        //p_values[IDS.V_ORIGIN_Y] = { value: 0 };
        p_values[IDS.HEIGHT] = { value: 1000 };
        p_values[IDS.MONOSPACE] = { value: false };
        p_values[IDS.UNDERLINE_POSITION] = { value: null };
        p_values[IDS.UNDERLINE_THICKNESS] = { value: null };
        //p_values[IDS.HANGING] = { value: 500 };

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

        font.setAttribute(IDS.ID, fullName);
        font.setAttribute(SVGOPS.ATT_H_ADVANCE, this.Resolve(IDS.WIDTH));
        font.setAttribute(SVGOPS.ATT_V_ADVANCE, this.Resolve(IDS.HEIGHT));

        fontFaceSrcName.setAttribute(`name`, fullName);

        fontFace.setAttribute(SVGOPS.ATT_ASCENT, this.Get(IDS.BASELINE));
        fontFace.setAttribute(SVGOPS.ATT_DESCENT, this.Get(IDS.DESCENT));
        fontFace.setAttribute(SVGOPS.ATT_EM_UNITS, this.Get(IDS.EM_UNITS));
        fontFace.setAttribute(SVGOPS.ATT_WEIGHT_CLASS, this.Get(IDS.WEIGHT_CLASS));
        fontFace.setAttribute('font-stretch', 'normal');


        if (this._catalogItem) { this._catalogItem.name = fullName; }

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