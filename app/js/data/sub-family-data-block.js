'use strict';

/*const nkm = require(`@nkmjs/core`);*/
const dom = nkm.ui.dom;
const u = nkm.utils;
const io = nkm.io;

const SimpleDataEx = require(`./simple-data-ex`);
const SIGNAL = require(`./signal`);
const IDS = require(`./ids`);

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


        this._previewInfos = {
            raw: 1,
            rah: 1,
            w: 1000,
            h: 1000,
            rh: 1000,
            asc: 1000,
            dsc: 0,
            ref: 1000,
            em: 1000,
        }

        let defaultEm = 1000;

        this._values = {
            [IDS.WEIGHT_CLASS]: { value: IDS.weightList.At(3) },
            [IDS.FONT_STYLE]: { value: null },
            
            [IDS.CAP_HEIGHT]: { value: null },
            [IDS.X_HEIGHT]: { value: null },
            
            [IDS.EM_UNITS]: { value: defaultEm },
            [IDS.EM_RESAMPLE]: { value: true },
            [IDS.ASCENT]: { value: defaultEm * 0.8 },
            [IDS.DESCENT]: { value: defaultEm * -0.25 },
            //[IDS.H_ORIGIN_X]: { value: 0 },
            //[IDS.H_ORIGIN_Y]: { value: 0 },
            [IDS.WIDTH]: { value: null },
            //[IDS.V_ORIGIN_X]: { value: 0 },
            //[IDS.V_ORIGIN_Y]: { value: 0 },
            [IDS.HEIGHT]: { value: null },
            [IDS.MONOSPACE]: { value: false },
            [IDS.UNDERLINE_POSITION]: { value: null },
            [IDS.UNDERLINE_THICKNESS]: { value: null },
            //[IDS.HANGING]: { value: 500 },

            [IDS.SIZE]: { value: null },
            [IDS.DISPLAY_SIZE]: { value: null },
            [IDS.DISPLAY_OFFSET]: { value: null }

            
        };

        this._family = null;
        this._ttfBytes = null;

        this._catalogItem = null;

    }

    _BuildFontObject() { return svgFontRef.cloneNode(true); }

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

    Resolve(p_id) {

        let localValue = this.Get(p_id);

        if (localValue == null) {

            switch (p_id) {
                case IDS.CAP_HEIGHT: return this.Get(IDS.ASCENT); break;
                case IDS.X_HEIGHT: return this.Get(IDS.ASCENT) * 0.75; break;
                case IDS.UNDERLINE_POSITION: return this.Get(IDS.DESCENT) * 1.2; break;
                case IDS.UNDERLINE_THICKNESS: return this.Get(IDS.EM_UNITS) * 0.1; break;
                //case IDS.WIDTH: return this.Get(IDS.MONOSPACE) ? this.Get(IDS.EM_UNITS); break;
                case IDS.HEIGHT: return this.Get(IDS.ASCENT) - this.Get(IDS.DESCENT); break;
                default: return super.Resolve(p_id); break;
            }

        }

        return super.Resolve(p_id);
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

        dom.SAtt(fontFace, IDS.WEIGHT_CLASS, this.Get(IDS.WEIGHT_CLASS).GetOption(`value`), true);

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
            rh = Math.max(fh, h),
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

        this._previewInfos.raw = ratio_w;
        this._previewInfos.rah = ratio_h;
        this._previewInfos.w = fw;
        this._previewInfos.h = fh;
        this._previewInfos.rh = rh;
        this._previewInfos.asc = asc;
        this._previewInfos.dsc = dsc;
        this._previewInfos.ref = ref;
        this._previewInfos.em = em;

        //this.Set(IDS.SIZE, rh, true);
        //this.Set(IDS.DISPLAY_SIZE, ref, true);
        //this.Set(IDS.DISPLAY_OFFSET, 0, true);

    }

    CommitUpdate() {
        this._UpdateDisplayValues();
        super.CommitUpdate();
    }

}

module.exports = SubFamilyDataBlock;