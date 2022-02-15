'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const io = nkm.io;

class FontVariantDataBlock extends nkm.data.DataBlock {

    constructor() { super(); }

    static NULL = new FontVariantDataBlock();

    _Init() {

        super._Init();

        this._horiz_origin_x = null; // attribute indicates the x-coordinate in the font coordinate system of the origin of a glyph to be used when drawing horizontally oriented text.
        this._horiz_origin_y = null; // attribute indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing horizontally oriented text.
        this._horiz_adv_x = null; // attribute indicates the horizontal advance after rendering a glyph in horizontal orientation.
        this._vert_origin_x = null; // attribute indicates the x-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.
        this._vert_origin_y = null; // attribute indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.
        this._vert_adv_y = null; // attribute indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.

    }

    _CleanUp() {
        this.parentGlyph = null;
        super._CleanUp();
    }


}

module.exports = FontVariantDataBlock;