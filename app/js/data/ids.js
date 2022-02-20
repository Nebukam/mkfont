'use strict';

const nkm = require(`@nkmjs/core`);
const inputs = nkm.uilib.inputs;

/**
 * @description TODO
 * @class
 * @hideconstructor
 * @memberof ui.core
 */
class IDS {
    constructor() { }

    static ID = 'id';

    static VARIANT = 'variant-name';
    static FAMILY = 'family';
    static FONT_WEIGHT = 'font-weight';
    static FONT_STYLE = 'font-style';
    static EM_UNITS = 'units-per-em';
    static CAP_HEIGHT = 'cap-height';
    static X_HEIGHT = 'x-height';
    static ASCENT = 'ascent';
    static DESCENT = 'descent';
    static H_ORIGIN_X = 'horiz-origin-x';
    static H_ORIGIN_Y = 'horiz-origin-y';
    static H_ADV_X = 'horiz-adv-x';
    static V_ORIGIN_X = 'vert-origin-x';
    static V_ORIGIN_Y = 'vert-origin-y';
    static V_ADV_Y = 'vert-adv-y';
    static ALPHABETIC = 'alphabetic';
    static MATHEMATICAL = 'mathematical';
    static IDEOGRAPHIC = 'ideographic';
    static HANGING = 'hanging';
    static PATH = 'path';
    static SIZE = 'size';
    static DISPLAY_SIZE = 'display-size';
    static DISPLAY_OFFSET = 'display-offset';
    static COLOR_PREVIEW = 'color-preview';

    static SUB_FAMILY_NAME = 'subfamilyName';
    static METADATA = 'metadata';
    static COPYRIGHT = 'copyright';
    static DESCRIPTION = 'description';
    static URL = 'url';
    static VERSION = 'version';

    static UNICODE = 'unicode';
    static DECIMAL = 'decimal';


    static infos = {
        [this.ID]: {
            inputType:inputs.Text,
            desc: ``
        },
        [this.VARIANT]: {
            inputType:inputs.Text,
            label:`Variant name`,
            desc: `Regular, Normal, Bold, Semibold, ...`
        },
        [this.FAMILY]: {
            inputType:inputs.Text,
            label:`Family name`,
            desc: ``
        },
        [this.FONT_WEIGHT]: {
            inputType:inputs.Text,
            label:`Variant name`,
            desc: `CSS Weight (bold, normal, ...)`
        },
        [this.FONT_STYLE]: {
            inputType:inputs.Text,
            label:`Style`,
            desc: `normal, sans-serif, serif, ...`
        },
        [this.EM_UNITS]: {
            inputType:inputs.Number,
            label:`EM Size`,
            inputOptions:{ step:10, min:2, max:10000 },
            desc: `specifies the number of coordinate units on the "em square", an abstract square whose height is the intended distance between lines of type in the same type size. This is the size of the design grid on which glyphs are laid out.`
        },
        [this.CAP_HEIGHT]: {
            inputType:inputs.Number,
            label:`Capital height`,
            desc: `defines the height of uppercase glyphs of the font within the font coordinate system.`
        },
        [this.X_HEIGHT]: {
            inputType:inputs.Number,
            label:`x height`,
            desc: `indicates the height of lowercase glyphs in the font within the font coordinate.`
        },
        [this.ASCENT]: {
            inputType:inputs.Number,
            label:`Ascender`,
            desc: `defines the maximum unaccented height of the font within the font coordinate system.`
        },
        [this.DESCENT]: {
            inputType:inputs.Number,
            label:`Descender`,
            desc: `defines the maximum unaccented depth of the font.`
        },
        [this.H_ORIGIN_X]: {
            inputType:inputs.Number,
            desc: `indicates the x-coordinate in the font coordinate system of the origin of a glyph to be used when drawing horizontally oriented text.`
        },
        [this.H_ORIGIN_Y]: {
            inputType:inputs.Number,
            desc: `indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing horizontally oriented text.`
        },
        [this.H_ADV_X]: {
            inputType:inputs.Number,
            label:`H advance`,
            desc: `indicates the horizontal advance after rendering a glyph in horizontal orientation.`
        },
        [this.V_ORIGIN_X]: {
            inputType:inputs.Number,
            desc: `indicates the x-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.`
        },
        [this.V_ORIGIN_Y]: {
            inputType:inputs.Number,
            desc: `indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.`
        },
        [this.V_ADV_Y]: {
            inputType:inputs.Number,
            label:`V advance`,
            desc: `indicates the vertical advance after rendering a glyph in vertical orientation.`
        },
        [this.ALPHABETIC]: {
            inputType:inputs.Number,
            desc: ``
        },
        [this.IDEOGRAPHIC]: {
            inputType:inputs.Number,
            desc: ``
        },
        [this.HANGING]: {
            inputType:inputs.Number,
            desc: ``
        },
        [this.SUB_FAMILY_NAME]: {
            inputType:inputs.Text,
            label:`Sub`,
            desc: ``
        },
        [this.METADATA]: {
            inputType:inputs.Text,
            desc: ``
        },
        [this.COPYRIGHT]: {
            inputType:inputs.Text,
            label:`©`,
            desc: ``
        },
        [this.DESCRIPTION]: {
            inputType:inputs.Text,
            label:`Description`,
            desc: ``
        },
        [this.URL]: {
            inputType:inputs.Text,
            desc: ``
        },
        [this.VERSION]: {
            inputType:inputs.Text,
            desc: ``
        },
        [this.UNICODE]: {
            inputType:inputs.Text,
            desc: ``
        },
        [this.COLOR_PREVIEW]: {
            inputType:inputs.Color,
            label:`Preview color`,
            inputOptions:{ changeOnInput:true },
            desc: `Define the color of the glyphs in the editor.`
        },
        
    }

    static GetInfos(p_id) {
        return p_id in this.infos ? this.infos[p_id] : null;
    }

}

module.exports = IDS;