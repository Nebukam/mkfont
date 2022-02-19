'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.utils;
const io = nkm.io;

const IDS = require(`./ids`);

const domparser = new DOMParser();
const svgString = `<glyph glyph-name="" unicode="" d=""></glyph>`;

const svgGlyphRef = domparser.parseFromString(svgString, `image/svg+xml`).getElementsByTagName(`glyph`)[0];

class GlyphVariantDataBlock extends nkm.data.SimpleDataBlock {

    constructor() { super(); }

    static NULL = new GlyphVariantDataBlock();

    _Init() {

        super._Init();

        this._values = {
            [IDS.H_ORIGIN_X]: { value: null },
            [IDS.H_ORIGIN_Y]: { value: null },
            [IDS.H_ADV_X]: { value: null },
            [IDS.V_ORIGIN_X]: { value: null },
            [IDS.V_ORIGIN_Y]: { value: null },
            [IDS.V_ADV_Y]: { value: null },
            [IDS.PATH]: { value: '', setter:IDS.PATH }
        }

        this._glyph = null;
        this._isDefault = false;

        this._svg = null;
        this._svgGlyph = svgGlyphRef.cloneNode(true);
        this._viewBox = null;

        // Variant manangement : UI should show a drop-down allowing to assign a variant found in the Family object
        // if a variant is deleted, flag this variant as "unassigned"
        // if a variant is added whille glyph have unassigned variants : 

    }

    set glyph(p_value) { this._glyph = p_value; }
    get glyph() { return this._glyph; }

    get subFamily(){ return this._subFamily; }
    set subFamily(p_variant) {
        if (this._subFamily == p_variant) { return; }
        this._subFamily = p_variant;
        if (this._subFamily) { this._subFamily.xml.appendChild(this._svgGlyph); }
        else { this._svgGlyph.remove(); }
    }

    get svgGlyph() { return this._svgGlyph; }

    set path(p_value){ this._svgGlyph.setAttribute(`d`, p_value); }

    _CleanUp() {
        this.glyph = null;
        this._svgGlyph.remove();
        super._CleanUp();
    }


}

module.exports = GlyphVariantDataBlock;