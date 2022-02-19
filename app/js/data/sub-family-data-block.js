'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.utils;
const io = nkm.io;

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


class SubFamilyDataBlock extends nkm.data.SimpleDataBlock {

    constructor() { super(); }

    static NULL = new SubFamilyDataBlock();

    _Init() {

        super._Init();

        let defaultEm = 1000;

        this._values = {
            [IDS.ID]: { value: `font_id` },
            [IDS.VARIANT]: { value: `Bold` },
            [IDS.FAMILY]: { value: null },
            [IDS.FONT_WEIGHT]: { value: `bold` },
            [IDS.FONT_STYLE]: { value: `normal` },
            [IDS.EM_UNITS]: { value: defaultEm },
            [IDS.CAP_HEIGHT]: { value: defaultEm * 0.8 },
            [IDS.X_HEIGHT]: { value: defaultEm * 0.5 },
            [IDS.ASCENT]: { value: defaultEm * 0.8 },
            [IDS.DESCENT]: { value: defaultEm * -0.25 },
            [IDS.H_ORIGIN_X]: { value: null },
            [IDS.H_ORIGIN_Y]: { value: null },
            [IDS.H_ADV_X]: { value: null }, // use EM_UNITS at export time
            [IDS.V_ORIGIN_X]: { value: null },
            [IDS.V_ORIGIN_Y]: { value: null },
            [IDS.V_ADV_Y]: { value: null },
            [IDS.ALPHABETIC]: { value: 0 },
            [IDS.MATHEMATICAL]: { value: 350 },
            [IDS.IDEOGRAPHIC]: { value: 400 },
            [IDS.HANGING]: { value: 500 },
            [IDS.SIZE]: { value: null },
            [IDS.DISPLAY_SIZE]: { value: null },
            [IDS.DISPLAY_OFFSET]: { value: null }
        };

        this._family = null;
        this._isDefault = false;
        this._ttfBytes = null;

        this._svgString = ``;
        this._svgURI = null;
        
        this._xml = svgFontRef.cloneNode(true);
        this._xmlFontFace = this._xml.getElementsByTagName(`font-face`)[0];
        this._xmlFontFaceSrc = this._xml.getElementsByTagName(`font-face-src`)[0];
        this._xmlFontFaceSrcName = this._xml.getElementsByTagName(`font-face-src-name`)[0];
        this._xmlMissingGlyph = this._xml.getElementsByTagName(`missing-glyph`)[0];

    }

    get family() { return this._family; }
    set family(p_value) {
        this._family = p_value;
        this._UpdateFontObject();
    }

    get ttfBytes() { return this._ttfBytes; }
    set ttfBytes(p_value) {
        this._ttfBytes = p_value;
        this._Broadcast(SIGNAL.TTF_UPDATED, this, this._ttfBytes);
    }

    get xml() { return this._xml; }

    _value(p_id) {
        let result = this.Get(p_id);
        if (!result) { result = this._isDefault ? null : this._family.defaultSubFamily.Get(p_id); }
        return result;
    }

    _UpdateFontObject() {

        dom.SAtt(this._xml, IDS.ID, this._value(IDS.ID), true);
        dom.SAtt(this._xml, IDS.H_ADV_X, this._value(IDS.EM_UNITS), true);
        dom.SAtt(this._xml, IDS.V_ADV_Y, this._value(IDS.EM_UNITS), true);
        dom.SAtt(this._xmlFontFaceSrcName, `name`, `${this._value(IDS.FAMILY)} ${this._value(IDS.VARIANT)}`, true);

        dom.SAtt(this._xmlFontFace, this._values, `value`, true);

    }

    _UpdateDisplayValues(){

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

    CommitUpdate(){
        this._UpdateFontObject();
        this._UpdateDisplayValues();
        super.CommitUpdate();
    }

    _CleanUp() {
        this.parentGlyph = null;
        super._CleanUp();
    }


}

module.exports = SubFamilyDataBlock;