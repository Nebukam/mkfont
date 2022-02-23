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

    static weightList = nkm.data.catalogs.CreateFrom({ name: `Weights`, autoSort:false }, [
        { name: `Thin`, value: 100 },
        { name: `Extra Light`, value: 200 },
        { name: `Light`, value: 300 },
        { name: `Normal`, value: 400 },
        { name: `Medium`, value: 500 },
        { name: `Semi Bold`, value: 600 },
        { name: `Bold`, value: 700 },
        { name: `Extra Bold`, value: 800 },
        { name: `Black`, value: 900 },
    ]);

    // Family properties
    static ID = 'id';
    static FAMILY = 'font-family';
    static METADATA = 'metadata';
    static COPYRIGHT = 'copyright';
    static DESCRIPTION = 'description';
    static URL = 'url';
    static VERSION = 'version';
    static ALPHABETIC = 'alphabetic';
    static MATHEMATICAL = 'mathematical';
    static IDEOGRAPHIC = 'ideographic';

    // SubFamily properties
    static WEIGHT_CLASS = 'font-weight';
    static FONT_STYLE = 'font-style';
    static EM_UNITS = 'units-per-em';
    static CAP_HEIGHT = 'cap-height';
    static X_HEIGHT = 'x-height';
    static ASCENT = 'ascent';
    static DESCENT = 'descent';
    static HANGING = 'hanging';
    static UNDERLINE_THICKNESS = 'underline-thickness';
    static UNDERLINE_POSITION = 'underline-position';

    // Glyph properties
    static H_ORIGIN_X = 'horiz-origin-x';
    static H_ORIGIN_Y = 'horiz-origin-y';
    static WIDTH = 'horiz-adv-x';
    static V_ORIGIN_X = 'vert-origin-x';
    static V_ORIGIN_Y = 'vert-origin-y';
    static HEIGHT = 'vert-adv-y';

    static PATH = 'path';
    static GLYPH_NAME = 'glyph-name';
    static UNICODE = 'unicode';
    static DECIMAL = 'decimal';

    // Misc properties
    static SIZE = 'size';
    static DISPLAY_SIZE = 'display-size';
    static DISPLAY_OFFSET = 'display-offset';
    static COLOR_PREVIEW = 'color-preview';

    static infos = {

        // Family properties

        [this.ID]: {
            inputType: inputs.Text,
            label: `Identifier`,
            inputOptions: { placeholder:`...` },
            desc: ``
        },
        [this.FAMILY]: {
            inputType: inputs.Text,
            label: `Family name`,
            inputOptions: { placeholder:`...` },
            desc: ``
        },
        [this.METADATA]: {
            inputType: inputs.Textarea,
            label: `Metadata`,
            inputOptions: { placeholder:`...` },
            desc: ``
        },
        [this.COPYRIGHT]: {
            inputType: inputs.Text,
            label: `Copyright`,
            inputOptions: { placeholder:`...` },
            desc: ``
        },
        [this.DESCRIPTION]: {
            inputType: inputs.Textarea,
            label: `Description`,
            desc: ``
        },
        [this.URL]: {
            inputType: inputs.Text,
            label: `URL`,
            inputOptions: { placeholder:`www.website.com` },
            desc: ``
        },
        [this.VERSION]: {
            inputType: inputs.Text,
            label: `Version`,
            inputOptions: { placeholder:`1.0` },
            desc: ``
        },
        [this.ALPHABETIC]: {
            inputType: inputs.Number,
            desc: ``
        },
        [this.MATHEMATICAL]: {
            inputType: inputs.Number,
            desc: ``
        },
        [this.IDEOGRAPHIC]: {
            inputType: inputs.Number,
            desc: ``
        },

        // SubFamily Properties

        [this.WEIGHT_CLASS]: {
            inputType: inputs.Select,
            label: `Weight class`,
            inputOptions: { catalog:this.weightList },
            desc: `Normal, Bold, Heavy, Ultra-Heavy`,
        },
        [this.FONT_STYLE]: {
            inputType: inputs.Text,
            label: `Sub Family`,
            inputOptions: { placeholder:`Regular` },
            desc: `Regular, Italic, Condensed...`
        },
        [this.EM_UNITS]: {
            inputType: inputs.Number,
            label: `EM Size`,
            inputOptions: { step: 10, min: 2, max: 32000 },
            desc: `specifies the number of coordinate units on the "em square", an abstract square whose height is the intended distance between lines of type in the same type size. This is the size of the design grid on which glyphs are laid out.`
        },
        [this.CAP_HEIGHT]: {
            inputType: inputs.Number,
            label: `Capital height`,
            desc: `defines the height of uppercase glyphs of the font within the font coordinate system.`
        },
        [this.X_HEIGHT]: {
            inputType: inputs.Number,
            label: `X height`,
            desc: `indicates the height of lowercase glyphs in the font within the font coordinate.`
        },
        [this.ASCENT]: {
            inputType: inputs.Number,
            label: `Ascender`,
            inputOptions: { step: 1, min: 0, max: 32000 },
            desc: `defines the maximum unaccented height of the font within the font coordinate system.`
        },
        [this.DESCENT]: {
            inputType: inputs.Number,
            label: `Descender`,
            inputOptions: { step: 1, min: -32000, max: 0 },
            desc: `defines the maximum unaccented depth of the font.`
        },

        [this.UNDERLINE_THICKNESS]: {
            inputType: inputs.Number,
            label: `Underline thickness`,
            desc: `...`
        },
        [this.UNDERLINE_POSITION]: {
            inputType: inputs.Number,
            label: `Underline position`,
            desc: `...`
        },

        [this.HANGING]: {
            inputType: inputs.Number,
            desc: ``
        },

        // Glyph properties

        [this.H_ORIGIN_X]: {
            inputType: inputs.Number,
            desc: `indicates the x-coordinate in the font coordinate system of the origin of a glyph to be used when drawing horizontally oriented text.`
        },
        [this.H_ORIGIN_Y]: {
            inputType: inputs.Number,
            desc: `indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing horizontally oriented text.`
        },
        [this.WIDTH]: {
            inputType: inputs.Number,
            label: `Width`,
            desc: `indicates the horizontal advance after rendering a glyph in horizontal orientation.`
        },
        [this.V_ORIGIN_X]: {
            inputType: inputs.Number,
            desc: `indicates the x-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.`
        },
        [this.V_ORIGIN_Y]: {
            inputType: inputs.Number,
            desc: `indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.`
        },
        [this.HEIGHT]: {
            inputType: inputs.Number,
            label: `Height`,
            desc: `indicates the vertical advance after rendering a glyph in vertical orientation.`
        },
        [this.GLYPH_NAME]: {
            inputType: inputs.Text,
            label: `Glyph name`,
            desc: `Define the color of the glyphs in the editor.`
        },
        [this.UNICODE]: {
            inputType: inputs.Text,
            desc: ``
        },

        // Misc

        [this.COLOR_PREVIEW]: {
            inputType: inputs.Color,
            label: `Preview color`,
            inputOptions: { changeOnInput: true },
            desc: `Define the color of the glyphs in the editor.`
        },

    }

    static GetInfos(p_id) {
        return p_id in this.infos ? this.infos[p_id] : null;
    }

}

module.exports = IDS;