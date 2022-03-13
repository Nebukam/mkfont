'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;

/**
 * @description TODO
 * @class
 * @hideconstructor
 * @memberof ui.core
 */
class IDS {
    constructor() { }

    static weightList = nkm.data.catalogs.CreateFrom({ name: `Weights`, autoSort: false }, [
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
    static EM_RESAMPLE = 'do-em-scale';
    static MONOSPACE = 'monospace';

    // Glyph properties
    static H_ORIGIN_X = 'horiz-origin-x';
    static H_ORIGIN_Y = 'horiz-origin-y';
    static WIDTH = 'horiz-adv-x';
    static V_ORIGIN_X = 'vert-origin-x';
    static V_ORIGIN_Y = 'vert-origin-y';
    static HEIGHT = 'vert-adv-y';

    static PATH = 'path';
    static PATH_DATA = 'path-data';
    static GLYPH_NAME = 'glyph-name';
    static UNICODE = 'unicode';

    // Misc properties
    static SIZE = 'size';
    static DISPLAY_SIZE = 'display-size';
    static DISPLAY_OFFSET = 'display-offset';

    static CUSTOM_WIDTH = 'custom-width';

    static COLOR_PREVIEW = 'color-preview';
    static PREVIEW_SIZE = 'preview-size';
    static OUT_OF_BOUNDS = 'out-of-bounds';

    // Import properties

    static trReference = nkm.data.catalogs.CreateFrom({ name: `Transform reference`, autoSort: false }, [
        { name: `Imported bounds`, value: 0, icon: 'bounds-outside' },
        { name: `Glyph bounds`, value: 1, icon: 'bounds-inside' },
    ]);

    static trScaleModes = nkm.data.catalogs.CreateFrom({ name: `Scale`, autoSort: false }, [
        { name: `None `, value: -1, icon: 'minus' },
        { name: `EM `, value: 0, icon: 'text-em' },
        { name: `Baseline`, value: 1, icon: 'font-baseline' },
        { name: `Spread`, value: 2, icon: 'font-bounds-h' },
        { name: `Height`, value: 3, icon: 'spread-ver' },
        { name: `Manual`, value: 4, icon: 'edit' },
    ]);

    static trVerAlign = nkm.data.catalogs.CreateFrom({ name: `Vertical anchoring`, autoSort: false }, [
        { name: `Top `, value: -1, icon: 'font-ascender' },
        { name: `Baseline`, value: 0, icon: 'font-baseline' },
        { name: `Descender`, value: 1, icon: 'font-descender' },
        { name: `Vertical spread`, value: 2, icon: 'center-ver' },
        //{ name: `To Value`, value: 2, icon: 'edit' },
    ]);

    static trVerAlignAnchors = nkm.data.catalogs.CreateFrom({ name: `Anchoring alignment`, autoSort: false }, [
        { name: `Bottom `, value: 0, icon: 'align-ver-bottom' },
        { name: `Center`, value: 1, icon: 'align-ver-center' },
        { name: `Top`, value: 2, icon: 'align-ver-top' },
    ]);

    static trHorAlign = nkm.data.catalogs.CreateFrom({ name: `Horizontal anchoring`, autoSort: false }, [
        { name: `Bound min x`, value: 0, icon: 'font-bounds-xmin' },
        { name: `Horizontal spread`, value: 1, icon: 'center-hor' },
        { name: `Bound max x`, value: 2, icon: 'font-bounds-xmax' },
        //{ name: `To Value`, value: 2, icon: 'edit' },
    ]);

    static trHorAlignAnchors = nkm.data.catalogs.CreateFrom({ name: `Anchoring alignment`, autoSort: false }, [
        { name: `Left `, value: 0, icon: 'align-hor-left' },
        { name: `Center`, value: 1, icon: 'align-hor-center' },
        { name: `Right`, value: 2, icon: 'align-hor-right' },
    ]);

    static TR_REFERENCE = 'tr-reference';
    static TR_SCALE_MODE = 'tr-scale-mode';
    static TR_SCALE_FACTOR = 'tr-scale-factor';
    
    static TR_VER_ALIGN = 'tr-ver-align';
    static TR_VER_ALIGN_ANCHOR = 'tr-ver-align-anchor';
    static TR_HOR_ALIGN = 'tr-hor-align';
    static TR_HOR_ALIGN_ANCHOR = 'tr-hor-align-anchor';

    static TR_WIDTH_SHIFT = 'tr-width-shift';
    static TR_WIDTH_PUSH = 'tr-width-push';
    

    static infos = {

        // Family properties

        [this.ID]: {
            inputType: inputs.Text,
            label: `Identifier`,
            inputOptions: { placeholder: `...` },
            desc: ``
        },
        [this.FAMILY]: {
            inputType: inputs.Text,
            label: `Family name`,
            inputOptions: { placeholder: `MkFamily`, maxlength: 32 },
            desc: ``
        },
        [this.METADATA]: {
            inputType: inputs.Textarea,
            label: `Metadata`,
            inputOptions: { placeholder: `metadata` },
            desc: ``
        },
        [this.COPYRIGHT]: {
            inputType: inputs.Text,
            label: `Copyright`,
            inputOptions: { placeholder: `copyright` },
            desc: ``
        },
        [this.DESCRIPTION]: {
            inputType: inputs.Textarea,
            label: `Description`,
            inputOptions: { placeholder: `Short description` },
            desc: ``
        },
        [this.URL]: {
            inputType: inputs.Text,
            label: `URL`,
            inputOptions: { placeholder: `www.website.com` },
            desc: ``
        },
        [this.VERSION]: {
            inputType: inputs.Text,
            label: `Version`,
            inputOptions: { placeholder: `1.0`, maxlength: 12 },
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
            inputOptions: { catalog: this.weightList },
            desc: `Normal, Bold, Heavy, Ultra-Heavy`,
        },
        [this.FONT_STYLE]: {
            inputType: inputs.Text,
            label: `Sub Family`,
            inputOptions: { placeholder: `Regular`, maxlength: 32 },
            desc: `Regular, Italic, Condensed...`
        },
        [this.EM_UNITS]: {
            recompute: true,
            inputType: inputs.Number,
            label: `EM Size`,
            inputOptions: { step: 10, min: 20, max: 32000 },
            desc: `specifies the number of coordinate units on the "em square", an abstract square whose height is the intended distance between lines of type in the same type size. This is the size of the design grid on which glyphs are laid out.`,
        },
        [this.CAP_HEIGHT]: {
            recompute: true,
            inputType: inputs.Number,
            label: `Capital height`,
            desc: `defines the height of uppercase glyphs of the font within the font coordinate system.`
        },
        [this.X_HEIGHT]: {
            recompute: true,
            inputType: inputs.Number,
            label: `X height`,
            desc: `indicates the height of lowercase glyphs in the font within the font coordinate.`
        },
        [this.ASCENT]: {
            recompute: true,
            inputType: inputs.Number,
            label: `Ascender`,
            inputOptions: { step: 1, min: 0, max: 32000 },
            desc: `defines the maximum unaccented height of the font within the font coordinate system.`
        },
        [this.DESCENT]: {
            recompute: true,
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
        [this.EM_RESAMPLE]: {
            inputType: inputs.Boolean,
            inputOptions: { size: ui.FLAGS.SIZE_XS },
            label: `EM Resample`,
            desc: `If enabled, changing the EM Size will scale other metrics & glyphs. Disable this if you want to affect rendering size only.`
        },
        [this.MONOSPACE]: {
            recompute: true,
            inputType: inputs.Boolean,
            inputOptions: { size: ui.FLAGS.SIZE_XS },
            label: `Monospace`,
            desc: `If enabled, glyphs width will be overriden by the default font width value. Override happen at export time and does not affect custom data.`
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
            recompute: true,
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
            recompute: true,
            inputType: inputs.Number,
            label: `Height`,
            desc: `indicates the vertical advance after rendering a glyph in vertical orientation.`
        },
        [this.GLYPH_NAME]: {
            inputType: inputs.Text,
            label: `Glyph name`,
            desc: `Glyph name for search purposes & future uses`
        },
        [this.UNICODE]: {
            recompute: true,
            inputType: inputs.Text,
            desc: ``
        },

        // Misc

        [this.COLOR_PREVIEW]: {
            recompute: true,
            inputType: inputs.Color,
            label: `Preview color`,
            inputOptions: { changeOnInput: true },
            desc: `Define the color of the glyphs in the editor.`
        },
        [this.PREVIEW_SIZE]: {
            recompute: true,
            inputType: inputs.SliderOnly,
            label: `Preview size`,
            inputOptions: { changeOnInput: true, step: 1, min: 100, max: 250, size: ui.FLAGS.SIZE_XXS },
            desc: `Preview size`
        },

        // Import settings
        
        [this.TR_REFERENCE]: {
            transform:true,
            inputType: inputs.InlineSelect,
            label: `Glyph bounds`,
            inputOptions: { catalog: this.trReference, size: ui.FLAGS.SIZE_M },
            desc: `The reference bounds used to compute transformations.`
        },
        [this.TR_SCALE_MODE]: {
            transform:true,
            inputType: inputs.InlineSelect,
            label: `Scale mode`,
            inputOptions: { catalog: this.trScaleModes, size: ui.FLAGS.SIZE_M },
            desc: `Scale`
        },
        [this.TR_SCALE_FACTOR]: {
            transform:true,
            inputType: inputs.Slider,
            label: `Scale factor`,
            inputOptions: { changeOnInput: true, step: 1, min: 0.01, max: 100, size: ui.FLAGS.SIZE_XXS },
            desc: `Factor by which the input vector will be scaled.`
        },

        [this.TR_WIDTH_SHIFT]: {
            transform:true,
            inputType: inputs.Number,
            label: `Shift`,
            inputOptions: { step: 1, min: 0, max: 5000, size: ui.FLAGS.SIZE_XXS },
            desc: `Shifts the advance`
        },
        [this.TR_WIDTH_PUSH]: {
            transform:true,
            inputType: inputs.Number,
            label: `Push`,
            inputOptions: { step: 1, min: 0, max: 5000, size: ui.FLAGS.SIZE_XXS },
            desc: `Expands advance`
        },

        [this.TR_VER_ALIGN]: {
            transform:true,
            inputType: inputs.InlineSelect,
            label: `Align`,
            inputOptions: { catalog: this.trVerAlign, size: ui.FLAGS.SIZE_M },
            desc: `...`
        },
        [this.TR_VER_ALIGN_ANCHOR]: {
            transform:true,
            inputType: inputs.InlineSelect,
            label: `Anchor`,
            inputOptions: { catalog: this.trVerAlignAnchors, size: ui.FLAGS.SIZE_M },
            desc: `...`
        },

        [this.TR_HOR_ALIGN]: {
            transform:true,
            inputType: inputs.InlineSelect,
            label: `Align`,
            inputOptions: { catalog: this.trHorAlign, size: ui.FLAGS.SIZE_M },
            desc: `...`
        },
        [this.TR_HOR_ALIGN_ANCHOR]: {
            transform:true,
            inputType: inputs.InlineSelect,
            label: `Anchor`,
            inputOptions: { catalog: this.trHorAlignAnchors, size: ui.FLAGS.SIZE_M },
            desc: `...`
        },

    }

    static GetInfos(p_id) {
        return p_id in this.infos ? this.infos[p_id] : null;
    }

}

module.exports = IDS;