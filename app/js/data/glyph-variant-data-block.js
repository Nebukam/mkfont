'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const io = nkm.io;

class GlyphVariantDataBlock extends nkm.data.DataBlock {

    constructor() { super(); }

    static NULL = new GlyphVariantDataBlock();

    _Init() {

        super._Init();

        this._parentGlyph = null;

        this._svgString = "";
        this._originalViewBox = { x: 0, y: 0, width: 0, height: 0 };
        this._viewBox = null;

        this._horiz_adv_x = null; // attribute indicates the horizontal advance after rendering a glyph in horizontal orientation.
        this._vert_origin_x = null; // attribute indicates the x-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.
        this._vert_origin_y = null; // attribute indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.
        this._vert_adv_y = null; // attribute indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.

        // Variant manangement : UI should show a drop-down allowing to assign a variant found in the Font object
        // if a variant is deleted, flag this variant as "unassigned"
        // if a variant is added whille glyph have unassigned variants : 

    }

    set parentGlyph(p_value) { this._parentGlyph = p_value; }
    get parentGlyph() { return this._parentGlyph; }

    get viewBox() {
        if (this._viewBox) { return this._viewBox; }
        if (this._parentGlyph) {
            if (this._parentGlyph.parentFont) {
                return this._parentGlyph.parentFont.viewBox;
            }
        }
        return null;
    }
    set viewBox(p_value) {
        this._viewBox = p_value;
        this.CommitUpdate();
    }

    get svgString() { return this._svgString; }
    set svgString(p_svg) {
        this._svgString = p_svg;
    }

    _CleanUp() {
        this.parentGlyph = null;
        super._CleanUp();
    }


}

module.exports = GlyphVariantDataBlock;