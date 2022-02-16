'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.utils;
const io = nkm.io;


class GlyphVariantDataBlock extends nkm.data.DataBlock {

    constructor() { super(); }

    static NULL = new GlyphVariantDataBlock();

    _Init() {

        super._Init();

        this._parentGlyph = null;
        this._xml = document.createElement(`glyph`);

        this._svg = null;
        this._originalViewBox = { x: 0, y: 0, width: 0, height: 0 };
        this._viewBox = null;

        this._params = {
            'horiz-origin-x': {
                value: null,
                desc: `indicates the x-coordinate in the font coordinate system of the origin of a glyph to be used when drawing horizontally oriented text.`
            },
            'horiz-origin-y': {
                value: null,
                desc: `indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing horizontally oriented text.`
            },
            'horiz-adv-x': {
                value: null,
                desc: `indicates the horizontal advance after rendering a glyph in horizontal orientation.`
            },
            'vert-origin-x': {
                value: null,
                desc: `indicates the x-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.`
            },
            'vert-origin-x': {
                value: null,
                desc: `indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.`
            },
            'vert-adv-y': {
                value: null,
                desc: `indicates the vertical advance after rendering a glyph in vertical orientation.`
            }
        }

        // Variant manangement : UI should show a drop-down allowing to assign a variant found in the Font object
        // if a variant is deleted, flag this variant as "unassigned"
        // if a variant is added whille glyph have unassigned variants : 

    }

    get xml() { return this._xml; }

    set parentGlyph(p_value) { this._parentGlyph = p_value; }
    get parentGlyph() { return this._parentGlyph; }

    set variant(p_variant) {
        if (this._variant == p_variant) { return; }
        this._variant = p_variant;
        if (this._variant) { this._variant.xml.appendChild(this._xml); }
        else { this._xml.remove(); }
    }

    set unicode(p_value) { this._xml.setAttribute(`unicode`, p_value); }

    get svg() { return this._svg; }
    set svg(p_svg) {
        this._svg = p_svg;
        this.CommitUpdate();
    }

    CommitUpdate() {
        this._xml.innerHTML = this._svg ? this._svg.outerHTML : ``;
        dom.SAtt(this._xml, this._params, `value`, true);
        super.CommitUpdate();
    }

    _CleanUp() {
        this.parentGlyph = null;
        this._xml.remove();
        super._CleanUp();
    }


}

module.exports = GlyphVariantDataBlock;