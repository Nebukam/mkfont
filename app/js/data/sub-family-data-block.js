'use strict';

const nkm = require(`@nkmjs/core`);
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

        let defaultEm = 1000;

        this._values = {
            [IDS.EM_UNITS]: { value: defaultEm },
            [IDS.WEIGHT_CLASS]: { value: IDS.weightList.At(3) },
            [IDS.FONT_STYLE]: { value: null },
            [IDS.CAP_HEIGHT]: { value: null },
            [IDS.X_HEIGHT]: { value: null },
            [IDS.ASCENT]: { value: defaultEm * 0.8 },
            [IDS.DESCENT]: { value: defaultEm * -0.25 },
            //[IDS.H_ORIGIN_X]: { value: 0 },
            //[IDS.H_ORIGIN_Y]: { value: 0 },
            [IDS.WIDTH]: { value: null },
            //[IDS.V_ORIGIN_X]: { value: 0 },
            //[IDS.V_ORIGIN_Y]: { value: 0 },
            [IDS.HEIGHT]: { value: null },
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
                case IDS.WIDTH: return this.Get(IDS.EM_UNITS); break;
                case IDS.HEIGHT: return this.Get(IDS.EM_UNITS); break;
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

        if(this._catalogItem){ this._catalogItem.name = fullName; }

    }

    _UpdateDisplayValues() {

        let
            em = this.Get(IDS.EM_UNITS) * 0.8,
            h = this.Get(IDS.ASCENT) - this.Get(IDS.DESCENT),
            size = h,//Math.max(em, h),
            displaySize = size * 1.25,
            displayOffset = (displaySize - size) * -0.5;

        this.Set(IDS.SIZE, size, true);
        this.Set(IDS.DISPLAY_SIZE, displaySize, true);
        this.Set(IDS.DISPLAY_OFFSET, displayOffset, true);

    }

    CommitUpdate() {
        this._UpdateDisplayValues();
        super.CommitUpdate();
    }

}

module.exports = SubFamilyDataBlock;