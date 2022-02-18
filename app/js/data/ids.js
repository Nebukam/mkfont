'use strict';

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

    static EM_RATIO_X = 'ratio-em-x';
    static EM_RATIO_Y = 'ratio-em-y';

    static FAMILY_NAME = 'familyName';
    static SUB_FAMILY_NAME = 'subfamilyName';
    static METADATA = 'metadata';
    static COPYRIGHT = 'copyright';
    static DESCRIPTION = 'description';
    static URL = 'url';
    static VERSION = 'version';
    

    static infos = {
        [this.EM_UNITS]: {
            desc: `specifies the number of coordinate units on the "em square", an abstract square whose height is the intended distance between lines of type in the same type size. This is the size of the design grid on which glyphs are laid out.`
        },
        [this.CAP_HEIGHT]: {
            desc: `defines the height of uppercase glyphs of the font within the font coordinate system.`
        },
        [this.X_HEIGHT]: {
            desc: `indicates the height of lowercase glyphs in the font within the font coordinate.`
        },
        [this.ASCENT]: {
            desc: `defines the maximum unaccented height of the font within the font coordinate system.`
        },
        [this.DESCENT]: {
            desc: `defines the maximum unaccented depth of the font.`
        },
        [this.H_ORIGIN_X]: {
            desc: `indicates the x-coordinate in the font coordinate system of the origin of a glyph to be used when drawing horizontally oriented text.`
        },
        [this.H_ORIGIN_Y]: {
            desc: `indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing horizontally oriented text.`
        },
        [this.H_ADV_X]: {
            desc: `indicates the horizontal advance after rendering a glyph in horizontal orientation.`
        },
        [this.V_ORIGIN_X]: {
            desc: `indicates the x-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.`
        },
        [this.V_ORIGIN_Y]: {
            desc: `indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.`
        },
        [this.V_ADV_Y]: {
            desc: `indicates the vertical advance after rendering a glyph in vertical orientation.`
        },
    }

}

module.exports = IDS;