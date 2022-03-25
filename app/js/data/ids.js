'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;

const ENUMS = require(`./enums`);

/**
 * @description TODO
 * @class
 * @hideconstructor
 * @memberof ui.core
 */
class IDS {
    constructor() { }

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
    static WEIGHT_CLASS = 'weight';
    static FONT_STYLE = 'style';
    static EM_UNITS = 'em';
    static CAP_HEIGHT = 'cap-height';
    static X_HEIGHT = 'x-height';
    static ASCENT = 'ascent';
    static DESCENT = 'descent';
    static HANGING = 'hanging';
    static BASELINE = 'baseline';
    static UNDERLINE_THICKNESS = 'u-thickness';
    static UNDERLINE_POSITION = 'u-position';
    static EM_RESAMPLE = 'em-resample';
    static MONOSPACE = 'monospace';

    // Glyph properties
    static H_ORIGIN_X = 'horiz-origin-x';
    static H_ORIGIN_Y = 'horiz-origin-y';
    static WIDTH = 'width';
    static V_ORIGIN_X = 'vert-origin-x';
    static V_ORIGIN_Y = 'vert-origin-y';
    static HEIGHT = 'height';

    static PATH = 'path';
    static PATH_DATA = 'path-data';
    static GLYPH_NAME = 'name';
    static UNICODE = 'unicode';

    // Misc properties
    static CUSTOM_WIDTH = 'custom-width';

    static COLOR_PREVIEW = 'color-preview';
    static PREVIEW_SIZE = 'preview-size';

    static OUT_OF_BOUNDS = 'out-of-bounds';
    static EXPORT_GLYPH = 'export-glyph';

    // Import properties


    static TR_BOUNDS_MODE = 'bounds';
    static TR_SCALE_MODE = 'scale';
    static TR_SCALE_FACTOR = 'scale-factor';
    
    static TR_VER_ALIGN = 'valign';
    static TR_VER_ALIGN_ANCHOR = 'vanchor';
    static TR_HOR_ALIGN = 'halign';
    static TR_HOR_ALIGN_ANCHOR = 'hanchor';

    static TR_WIDTH_SHIFT = 'xshift';
    static TR_WIDTH_PUSH = 'xpush';
    
    //
    static IMPORT_PREFIX = 'import-prefix';
    static IMPORT_SEPARATOR = 'import-sep';
    static IMPORT_MARK_X = 'import-x';
    static IMPORT_MARK_CAP = 'import-cap';
    static IMPORT_MARK_COL = 'import-col';
    

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
            enum:ENUMS.WEIGHTS,
            label: `Weight class`,
            inputOptions: { catalog: ENUMS.WEIGHTS, itemKey:nkm.com.IDS.VALUE },
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
            desc: `specifies the number of coordinate units on the "em square", an abstract square whose height is the intended distance between lines of type in the same type size.\nThis is the size of the design grid on which glyphs are laid out.`,
        },
        [this.CAP_HEIGHT]: {
            recompute: true,
            inputType: inputs.Number,
            label: `CAP height`,
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
            desc: `defines the maximum unaccented height of the font within the font coordinate system.\nRelative to baseline.`
        },
        [this.DESCENT]: {
            recompute: true,
            inputType: inputs.Number,
            label: `Descender`,
            inputOptions: { step: 1, min: -32000, max: 0 },
            desc: `defines the maximum unaccented depth of the font.\nRelative to baseline.`
        },
        [this.BASELINE]: {
            recompute: true,
            inputType: inputs.Number,
            label: `Baseline`,
            inputOptions: { step: 1, min: 0, max: 32000 },
            desc: `defines the position of the font baseline within the font coordinate system.`
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
            desc: `If enabled, changing the EM Size will scale other metrics & glyphs accordingly.\nDisable this if you want to affect rendering size only.`
        },
        [this.ASC_RESAMPLE]: {
            inputType: inputs.Boolean,
            inputOptions: { size: ui.FLAGS.SIZE_XS },
            label: `Scale X+Cap`,
            desc: `If enabled, changing the Ascender will scale x-height & cap-height accordingly.`
        },
        [this.MONOSPACE]: {
            recompute: true,
            inputType: inputs.Boolean,
            inputOptions: { size: ui.FLAGS.SIZE_XS },
            label: `Monospace`,
            desc: `If enabled, glyphs width will be overriden by the default font width value.\nOverride happen at export time and does not affect custom data.`
        },

        // Glyph properties
        /*
        [this.H_ORIGIN_X]: {
            inputType: inputs.Number,
            desc: `indicates the x-coordinate in the font coordinate system of the origin of a glyph to be used when drawing horizontally oriented text.`
        },
        [this.H_ORIGIN_Y]: {
            inputType: inputs.Number,
            desc: `indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing horizontally oriented text.`
        },
        */
        [this.WIDTH]: {
            recompute: true,
            inputType: inputs.Number,
            label: `Width`,
            desc: `indicates the horizontal advance after rendering a glyph in horizontal orientation.`
        },
        /*
        [this.V_ORIGIN_X]: {
            inputType: inputs.Number,
            desc: `indicates the x-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.`
        },
        [this.V_ORIGIN_Y]: {
            inputType: inputs.Number,
            desc: `indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.`
        },
        */
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

        
        [this.PATH]: {
            recompute: true,
        },
        [this.PATH_DATA]: {
            recompute: true,
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
            inputOptions: { changeOnInput: true, step: 1, min: 50, max: 250, size: ui.FLAGS.SIZE_XXS },
            desc: `Define the size of individual items in the list.`
        },

        // Import settings
        
        [this.TR_BOUNDS_MODE]: {
            transform:true,
            enum:ENUMS.BOUNDS,
            inputType: inputs.InlineSelect,
            label: `Glyph bounds`,
            inputOptions: { catalog: ENUMS.BOUNDS, itemKey:nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_M },
            desc: `The reference bounds used to compute transformations.`
        },
        [this.TR_SCALE_MODE]: {
            transform:true,
            enum:ENUMS.SCALE,
            inputType: inputs.InlineSelect,
            label: `Scale mode`,
            inputOptions: { catalog: ENUMS.SCALE, itemKey:nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_M },
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
            desc: `Shifts the X-advance.\nValues between -1 & 1 are treated as percentage of the glyph' width.\ni.e, 0.12 will be 12% of the glyph width.`
        },
        [this.TR_WIDTH_PUSH]: {
            transform:true,
            inputType: inputs.Number,
            label: `Push`,
            inputOptions: { step: 1, min: 0, max: 5000, size: ui.FLAGS.SIZE_XXS },
            desc: `Expands glyph X-advance.\nValues between -1 & 1 are treated as percentage of the glyph' width.\ni.e, 0.12 will be 12% of the glyph width.`
        },

        [this.TR_VER_ALIGN]: {
            transform:true,
            enum:ENUMS.VALIGN,
            inputType: inputs.InlineSelect,
            label: `Align`,
            inputOptions: { catalog: ENUMS.VALIGN, itemKey:nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_M },
            desc: `...`
        },
        [this.TR_VER_ALIGN_ANCHOR]: {
            transform:true,
            enum:ENUMS.VANCHOR,
            inputType: inputs.InlineSelect,
            label: `Anchor`,
            inputOptions: { catalog: ENUMS.VANCHOR, itemKey:nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_M },
            desc: `...`
        },

        [this.TR_HOR_ALIGN]: {
            transform:true,
            enum:ENUMS.HALIGN,
            inputType: inputs.InlineSelect,
            label: `Align`,
            inputOptions: { catalog: ENUMS.HALIGN, itemKey:nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_M },
            desc: `...`
        },
        [this.TR_HOR_ALIGN_ANCHOR]: {
            transform:true,
            enum:ENUMS.HANCHOR,
            inputType: inputs.InlineSelect,
            label: `Anchor`,
            inputOptions: { catalog: ENUMS.HANCHOR, itemKey:nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_M },
            desc: `...`
        },

        [this.IMPORT_PREFIX]: {
            transform:true,
            inputType: inputs.Text,
            label: `Name prefix`,
            desc: `Prefix used to check where the unicode definition starts in the filename.\nThe prefix and all characters before will be ignored.`
        },
        [this.IMPORT_SEPARATOR]: {
            transform:true,
            inputType: inputs.Text,
            label: `Separator`,
            desc: `Separator character in filenames.\nUsed to separate unicode values\ni.e char_U+0000, char_U+0000_U+0000, char_l_i_g_a`
        },
        [this.IMPORT_MARK_X]: {
            transform:true,
            inputType: inputs.Text,
            label: `X hint`,
            desc: `A string of text that, if found in the file name, will scale the glyph to X-Height instead of selected default.`
        },
        [this.IMPORT_MARK_CAP]: {
            transform:true,
            inputType: inputs.Text,
            label: `Cap hint`,
            desc: `A string of text that, if found in the file name, will scale the glyph to Cap-Height instead of selected default.`
        },
        [this.IMPORT_MARK_COL]: {
            transform:true,
            inputType: inputs.Color,
            label: `Bounds color`,
            desc: `Color used inside the imported SVG to 'mark' its special boundaries.\nSee online help for more about special boundaries.`
        },

        
        [this.EXPORT_GLYPH]: {
            label: `Export`,
            inputType: inputs.Boolean,
            inputOptions: { size: ui.FLAGS.SIZE_XS },
            desc: `Whtether this glyph will be added to the exported font or not.`
        },
        [this.OUT_OF_BOUNDS]: {
            label: `Out-of-bounds`,
            desc: `Separator character in filenames.\nUsed to separate unicode values\ni.e char_U+0000, char_U+0000_U+0000, char_l_i_g_a`
        },

        

    }

    static GetInfos(p_id) {
        return p_id in this.infos ? this.infos[p_id] : null;
    }

}

module.exports = IDS;