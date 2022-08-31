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

    static infos = {};

    static EMPTY_PATH_CONTENT = `M 0 0 L 0 0 z`;
    static isEmptyPathContent(p_path) { return p_path == this.EMPTY_PATH_CONTENT || p_path == `M0 0L0 0z`; }

    //#region family properties 

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

    static {

        this.infos[this.ID] = {
            inputType: inputs.Text,
            label: `Identifier`,
            inputOptions: { placeholder: `...` },
            desc: ``
        };

        this.infos[this.FAMILY] = {
            inputType: inputs.Text,
            label: `Family name`,
            inputOptions: { placeholder: `MkFamily`, maxlength: 32 },
            desc: ``
        };

        this.infos[this.METADATA] = {
            inputType: inputs.Textarea,
            label: `Metadata`,
            inputOptions: { placeholder: `metadata` },
            desc: ``
        };

        this.infos[this.COPYRIGHT] = {
            inputType: inputs.Text,
            label: `Copyright`,
            inputOptions: { placeholder: `copyright` },
            desc: ``
        };

        this.infos[this.DESCRIPTION] = {
            inputType: inputs.Textarea,
            label: `Description`,
            inputOptions: { placeholder: `Short description` },
            desc: ``
        };

        this.infos[this.URL] = {
            inputType: inputs.Text,
            label: `URL`,
            inputOptions: { placeholder: `www.website.com` },
            desc: ``
        };

        this.infos[this.VERSION] = {
            inputType: inputs.Text,
            label: `Version`,
            inputOptions: { placeholder: `1.0`, maxlength: 12 },
            desc: ``
        };

        this.infos[this.ALPHABETIC] = {
            inputType: inputs.NumberDrag,
            desc: ``
        };

        this.infos[this.MATHEMATICAL] = {
            inputType: inputs.NumberDrag,
            desc: ``
        };

        this.infos[this.IDEOGRAPHIC] = {
            inputType: inputs.NumberDrag,
            desc: ``
        };

    }

    //#endregion

    //#region Family metrics

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
    static ASC_RESAMPLE = 'asc-resample';
    static MONOSPACE = 'monospace';

    static {

        this.infos[this.WEIGHT_CLASS] = {
            inputType: inputs.Select,
            enum: ENUMS.WEIGHTS,
            label: `Weight class`,
            inputOptions: { catalog: ENUMS.WEIGHTS, itemKey: nkm.com.IDS.VALUE },
            desc: `Normal, Bold, Heavy, Ultra-Heavy`,
        };

        this.infos[this.FONT_STYLE] = {
            inputType: inputs.Text,
            label: `Sub Family`,
            inputOptions: { placeholder: `Regular`, maxlength: 32 },
            desc: `Regular, Italic, Condensed...`
        };

        this.infos[this.EM_UNITS] = {
            recompute: true,
            inputType: inputs.NumberDrag,
            label: `EM Size`,
            inputOptions: { step: 1, min: 20, max: 16000 },
            desc: `specifies the number of coordinate units on the "em square", an abstract square whose height is the intended distance between lines of type in the same type size.\nThis is the size of the design grid on which glyphs are laid out.`,
        };

        this.infos[this.CAP_HEIGHT] = {
            recompute: true,
            inputType: inputs.NumberDrag,
            label: `CAP height`,
            desc: `defines the height of uppercase glyphs of the font within the font coordinate system.`
        };

        this.infos[this.X_HEIGHT] = {
            recompute: true,
            inputType: inputs.NumberDrag,
            label: `X height`,
            desc: `indicates the height of lowercase glyphs in the font within the font coordinate.`
        };

        this.infos[this.ASCENT] = {
            recompute: true,
            inputType: inputs.NumberDrag,
            label: `Ascender`,
            inputOptions: { step: 1, min: 0, max: 16000 },
            desc: `defines the maximum unaccented height of the font within the font coordinate system.\nRelative to baseline.`
        };

        this.infos[this.DESCENT] = {
            recompute: true,
            inputType: inputs.NumberDrag,
            label: `Descender`,
            inputOptions: { step: 1, min: -16000, max: 0 },
            desc: `defines the maximum unaccented depth of the font.\nRelative to baseline.`
        };

        this.infos[this.BASELINE] = {
            recompute: true,
            inputType: inputs.NumberDrag,
            label: `Baseline`,
            inputOptions: { step: 1, min: 0, max: 16000 },
            desc: `defines the position of the font baseline within the font coordinate system.`
        };

        this.infos[this.UNDERLINE_THICKNESS] = {
            inputType: inputs.NumberDrag,
            label: `Underline thickness`,
            desc: `...`
        };

        this.infos[this.UNDERLINE_POSITION] = {
            inputType: inputs.NumberDrag,
            label: `Underline position`,
            desc: `...`
        };

        this.infos[this.HANGING] = {
            inputType: inputs.NumberDrag,
            desc: ``
        };

        this.infos[this.EM_RESAMPLE] = {
            inputType: inputs.Boolean,
            inputOptions: { size: ui.FLAGS.SIZE_XS },
            label: `EM Resample`,
            desc: `If enabled, changing the EM Size will scale other metrics & glyphs accordingly.\nDisable this if you want to affect rendering size only.`
        };

        this.infos[this.ASC_RESAMPLE] = {
            inputType: inputs.Boolean,
            inputOptions: { size: ui.FLAGS.SIZE_XS },
            label: `Scale X+Cap`,
            desc: `If enabled, changing the Ascender will scale x-height & cap-height accordingly.`
        };

        this.infos[this.MONOSPACE] = {
            recompute: true,
            inputType: inputs.Boolean,
            inputOptions: { size: ui.FLAGS.SIZE_XS },
            label: `Monospace`,
            desc: `If enabled, glyphs width will be overriden by the default font width value.\nOverride happen at export time and does not affect custom data.`
        };

    }

    //#endregion

    //#region Glyph properties
    static H_ORIGIN_X = 'horiz-origin-x';
    static H_ORIGIN_Y = 'horiz-origin-y';
    static WIDTH = 'width';
    static EXPORTED_WIDTH = 'ew';
    static V_ORIGIN_X = 'vert-origin-x';
    static V_ORIGIN_Y = 'vert-origin-y';
    static HEIGHT = 'height';

    static PATH = 'path';
    static PATH_DATA = 'path-data';
    static GLYPH_NAME = 'name';
    static UNICODE = 'unicode';

    static INVERTED = 'inverted';

    static {
        /*
        this.infos[this.H_ORIGIN_X] = {
            inputType: inputs.NumberDrag,
            desc: `indicates the x-coordinate in the font coordinate system of the origin of a glyph to be used when drawing horizontally oriented text.`
        };

        this.infos[this.H_ORIGIN_Y] = {
            inputType: inputs.NumberDrag,
            desc: `indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing horizontally oriented text.`
        };
        */

        this.infos[this.WIDTH] = {
            recompute: true,
            inputType: inputs.NumberDrag,
            inputOptions: { placeholder: `· · ·`, min: 0 },
            label: `Width`,
            desc: `indicates the horizontal advance after rendering a glyph in horizontal orientation.`
        };
        this.infos[this.EXPORTED_WIDTH] = {
            recompute: true,
            label: `...`,
            desc: `...`
        };

        /*
        this.infos[this.V_ORIGIN_X] = {
            inputType: inputs.NumberDrag,
            desc: `indicates the x-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.`
        };

        this.infos[this.V_ORIGIN_Y] = {
            inputType: inputs.NumberDrag,
            desc: `indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.`
        };
        */

        this.infos[this.HEIGHT] = {
            recompute: true,
            inputType: inputs.NumberDrag,
            inputOptions: { placeholder: `· · ·` },
            label: `Height`,
            desc: `indicates the vertical advance after rendering a glyph in vertical orientation.`
        };

        this.infos[this.GLYPH_NAME] = {
            inputType: inputs.Text,
            label: `Glyph name`,
            desc: `Glyph name for search purposes & future uses`
        };

        this.infos[this.UNICODE] = {
            recompute: true,
            inputType: inputs.Text,
            desc: ``
        };

        this.infos[this.PATH] = {
            recompute: true,
        };

        this.infos[this.PATH_DATA] = {
            recompute: true,
        };

        this.infos[this.INVERTED] = {
            recompute: true,
            label: `Reverse path`,
            inputType: inputs.Boolean,
            inputOptions: { size: ui.FLAGS.SIZE_XS },
            desc: `Whether or not to reverse the order of points withing the path. This effectively allows you to create "holes".`
        };
    }

    //#endregion

    //#region Misc properties
    static CUSTOM_WIDTH = 'custom-width';

    static COLOR_PREVIEW = 'color-preview';

    static PREVIEW_SIZE = 'preview-size';

    static OUT_OF_BOUNDS = 'out-of-bounds';
    static EMPTY = 'empty';
    static DO_EXPORT = 'do-export';

    static SHOW_ALL_LAYERS = 'show-all-layers';

    static FLATTEN_LAYERS = 'flatten-layers';
    static FLATTEN_MODE = 'flatten-mode';

    static {

        this.infos[this.COLOR_PREVIEW] = {
            recompute: true,
            inputType: inputs.Color,
            label: `Preview color`,
            inputOptions: { changeOnInput: true },
            desc: `Define the color of the glyphs in the editor.`
        };

        this.infos[this.PREVIEW_SIZE] = {
            recompute: true,
            inputType: inputs.SliderOnly,
            label: `Preview size`,
            inputOptions: { changeOnInput: true, step: 1, min: 70, max: 250, size: ui.FLAGS.SIZE_XS },
            desc: `Define the size of individual items in the list.`
        };

        this.infos[this.DO_EXPORT] = {
            recompute: true,
            label: `Export glyph`,
            inputType: inputs.Boolean,
            inputOptions: { size: ui.FLAGS.SIZE_XS },
            desc: `Whether this glyph will be added to the exported font or not.`
        };

        this.infos[this.OUT_OF_BOUNDS] = {
            label: `Out-of-bounds`,
            desc: `Separator character in filenames.\nUsed to separate unicode values\ni.e char_U+0000, char_U+0000_U+0000, char_l_i_g_a`
        };

        this.infos[this.EMPTY] = {
            label: `Empty`,
            desc: ``
        };

        this.infos[this.SHOW_ALL_LAYERS] = {
            label: `Show partial matches`,
            inputType: inputs.Boolean,
            inputOptions: { size: ui.FLAGS.SIZE_XS },
            desc: `Show all shared components (at least used twice), not just the ones shared by every glyph in the selection.`
        };

        this.infos[this.FLATTEN_LAYERS] = {
            recompute: true,
            label: `Flatten comps`,
            inputType: inputs.Boolean,
            inputOptions: { size: ui.FLAGS.SIZE_XS },
            desc: `Will flatten layers as if they were a single block.\nUses EM Square as transform space.`
        };
        this.infos[this.FLATTEN_MODE] = {
            inputType: inputs.Select,
            recompute: true,
            enum: ENUMS.WEIGHTS,
            label: `Flattening mode`,
            inputOptions: { catalog: ENUMS.FLATTEN_MODE, itemKey: nkm.com.IDS.VALUE, placeholder: `· · ·` },
            desc: `Defines how the boundaries of the flattened result are computed`
        };

    }

    //#endregion

    //#region Transform properties

    static TR_BOUNDS_MODE = 'bounds';
    static TR_SCALE_MODE = 'scale';
    static TR_SCALE_FACTOR = 'scale-factor';
    static TR_NRM_FACTOR = 'nrm-factor';

    static TR_VER_ALIGN = 'valign';
    static TR_HOR_ALIGN = 'halign';
    static TR_ANCHOR = 'anchor';

    static TR_WIDTH_SHIFT = 'xshift';
    static TR_WIDTH_PUSH = 'xpush';

    static TR_AUTO_WIDTH = 'auto-w';

    static TR_Y_OFFSET = 'yoffset';
    static TR_X_OFFSET = 'xoffset';

    static TR_MIRROR = 'mirror';
    static TR_ROTATION = 'rot';
    static TR_ROTATION_ANCHOR = 'rot-anchor';
    static TR_SKEW_X = 'skew-x';
    static TR_SKEW_Y = 'skew-y';
    static TR_SKEW_ROT_ORDER = 'skew-rot-order';

    static {

        this.infos[this.TR_BOUNDS_MODE] = {
            transform: true,
            enum: ENUMS.BOUNDS,
            inputType: inputs.SelectInline,
            label: `Glyph bounds`,
            inputOptions: { catalog: ENUMS.BOUNDS, itemKey: nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_M },
            desc: `The reference bounds used to compute transformations.`
        };

        this.infos[this.TR_SCALE_MODE] = {
            transform: true,
            enum: ENUMS.SCALE,
            inputType: inputs.SelectInline,
            label: `Scale mode`,
            inputOptions: { catalog: ENUMS.SCALE, itemKey: nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_M },
            desc: `Scale`
        };

        this.infos[this.TR_SCALE_FACTOR] = {
            transform: true,
            inputType: inputs.NumberDrag,
            label: `Scale factor`,
            inputOptions: { min: 0.01, max: 100, step: 0.01, size: ui.FLAGS.SIZE_XS },
            desc: `Factor by which the input vector will be scaled.`
        };

        this.infos[this.TR_NRM_FACTOR] = {
            transform: true,
            inputType: inputs.NumberDrag,
            label: `Margin`,
            inputOptions: { min: -1, max: 1, step: 0.01, size: ui.FLAGS.SIZE_XS },
            desc: `Margin to apply to the glyph when normalizing it.`
        };

        this.infos[this.TR_WIDTH_SHIFT] = {
            transform: true,
            recompute: true,
            inputType: inputs.NumberDrag,
            label: `Shift`,
            inputOptions: { step: 1, min: -16000, max: 16000, size: ui.FLAGS.SIZE_XXS, placeholder: `· · ·` },
            desc: `Append empty space before the glyph.`
        };
        this.infos[this.TR_WIDTH_PUSH] = {
            transform: true,
            recompute: true,
            inputType: inputs.NumberDrag,
            label: `Push`,
            inputOptions: { step: 1, min: -16000, max: 16000, size: ui.FLAGS.SIZE_XXS, placeholder: `· · ·` },
            desc: `Add empty space after the glyph.`
        };
        this.infos[this.TR_AUTO_WIDTH] = {
            transform: true,
            inputType: inputs.Boolean,
            label: `Automatic Width`,
            inputOptions: { size: ui.FLAGS.SIZE_XS, placeholder: `· · ·` },
            desc: `If enabled, the glyph' width is equal to its asset width + shift + push.\nOtherwise the value is expected to be either manual, or inherited from the family Metrics.`
        };


        this.infos[this.TR_Y_OFFSET] = {
            transform: true,
            recompute: true,
            inputType: inputs.NumberDrag,
            label: `Vertical Offset`,
            inputOptions: { step: 1, min: -16000, max: 16000, size: ui.FLAGS.SIZE_XXS, placeholder: `· · ·` },
            desc: `A vertical offset applied to the glyph position after everything else is computed.`
        };
        this.infos[this.TR_X_OFFSET] = {
            transform: true,
            recompute: true,
            inputType: inputs.NumberDrag,
            label: `Horizontal Offset`,
            inputOptions: { step: 1, min: -16000, max: 16000, size: ui.FLAGS.SIZE_XXS, placeholder: `· · ·` },
            desc: `An horizontal offset applied to the glyph position after everything else is computed.`
        };

        this.infos[this.TR_VER_ALIGN] = {
            transform: true,
            enum: ENUMS.VALIGN,
            inputType: inputs.SelectInline,
            label: `Align`,
            inputOptions: { catalog: ENUMS.VALIGN, itemKey: nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_M },
            desc: `...`
        };

        this.infos[this.TR_HOR_ALIGN] = {
            transform: true,
            enum: ENUMS.HALIGN,
            inputType: inputs.SelectInline,
            label: `Align`,
            inputOptions: { catalog: ENUMS.HALIGN, itemKey: nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_M },
            desc: `...`
        };

        this.infos[this.TR_ANCHOR] = {
            transform: true,
            enum: ENUMS.ANCHORS,
            inputType: inputs.Anchor,
            label: `Anchor`,
            //inputOptions: { catalog: ENUMS.ANCHORS, itemKey: nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_M },
            desc: `Defines the anchor point of the glyph within the typographic space.\n Used as reference for computing transformations.`
        };


        this.infos[this.TR_MIRROR] = {
            transform: true,
            enum: ENUMS.MIRROR,
            inputType: inputs.SelectInline,
            label: `Mirror`,
            inputOptions: { catalog: ENUMS.MIRROR, itemKey: nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_M },
            desc: `...`
        };
        this.infos[this.TR_ROTATION] = {
            transform: true,
            recompute: true,
            inputType: inputs.NumberDrag,
            label: `Rotation`,
            inputOptions: { step: 0.01, min: -180, max: 180, size: ui.FLAGS.SIZE_XS, placeholder: `· · ·` },
            desc: `Rotate the glyph around its anchor point.`
        };
        this.infos[this.TR_ROTATION_ANCHOR] = {
            transform: true,
            recompute: true,
            inputType: inputs.Anchor,
            label: `Rotation anchor`,
            //inputOptions: { changeOnInput: true, step: 0.01, min: -180, max: 180, size: ui.FLAGS.SIZE_XS },
            desc: `Defines the rotation anchor of the glyph`
        };

        this.infos[this.TR_SKEW_X] = {
            transform: true,
            recompute: true,
            inputType: inputs.NumberDrag,
            label: `Skew X`,
            inputOptions: { step: 0.1, min: -85, max: 85, size: ui.FLAGS.SIZE_XXS, placeholder: `· · ·` },
            desc: `Skews the glyph horizontally.`
        };
        this.infos[this.TR_SKEW_Y] = {
            transform: true,
            recompute: true,
            inputType: inputs.NumberDrag,
            label: `Skew Y`,
            inputOptions: { step: 0.1, min: -85, max: 85, size: ui.FLAGS.SIZE_XXS, placeholder: `· · ·` },
            desc: `Skews the glyph vertically.`
        };
        this.infos[this.TR_SKEW_ROT_ORDER] = {
            inputType: inputs.Select,
            enum: ENUMS.WEIGHTS,
            label: `Rot/Skew order`,
            inputOptions: { catalog: ENUMS.SKR_ORDER, itemKey: nkm.com.IDS.VALUE, placeholder: `· · ·` },
            desc: `Normal, Bold, Heavy, Ultra-Heavy`,
        };

    }

    //#endregion

    //#region Layer properties

    static TR_LYR_BOUNDS_MODE = 'lyr-bounds';
    static TR_LYR_SCALE_MODE = 'lyr-scale';
    static TR_LYR_SCALE_FACTOR = 'lyr-scale-factor';

    static TR_LYR_SELF_ANCHOR = 'lyr-anchor';

    static LYR_CHARACTER_NAME = 'lyr-char';
    static LYR_INDEX = 'lyr-index';
    static CIRCULAR_REFERENCE = 'circ-dep';

    static LYR_USE_PREV_LAYER = 'lyr-bounds-lyr';
    static LYR_PREV_LAYER_NAME = 'lyr-ref-lyr';
    static LYR_IS_CONTROL_LAYER = 'lyr-control';
    static LYR_CUSTOM_ID = 'lyr-id';

    static {

        this.infos[this.LYR_CHARACTER_NAME] = {
            inputType: inputs.Text,
            inputOptions: { placeholder: `A, U+0041, ...`, nullPlaceholder:`Mixed...` },
            label: `Import glyph`,
            desc: `Single character, ligature, or U+0000 formatted name`
        };

        this.infos[this.LYR_CUSTOM_ID] = {
            inputType: inputs.Text,
            inputOptions: { placeholder: `Custom ID` },
            label: `Custom ID`,
            desc: `A name used in place of the imported character to 'merge' layers when doing group editing.`
        };

        this.infos[this.LYR_INDEX] = {
            label: `Index`,
            desc: `Component index`
        };

        this.infos[this.LYR_USE_PREV_LAYER] = {
            inputType: inputs.Boolean,
            inputOptions: { size: ui.FLAGS.SIZE_XS },
            label: `Inherit prev. comp`,
            desc: `If enabled, This component use the first visible component before it as bound reference.`
        };

        this.infos[this.LYR_IS_CONTROL_LAYER] = {
            inputType: inputs.Boolean,
            inputOptions: { size: ui.FLAGS.SIZE_XS },
            label: `Control layer`,
            desc: `There can only be one control layer active at a time.\nIf enabled, the parent glyph will replicate the layer reference glyph settings before transformation.\nThis is only useful when working with glyphs that are empty except for layers.`
        };

        this.infos[this.TR_LYR_BOUNDS_MODE] = {
            transform: true,
            enum: ENUMS.BOUNDS,
            inputType: inputs.SelectInline,
            label: `Glyph bounds`,
            inputOptions: { catalog: ENUMS.LYR_BOUNDS, itemKey: nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_M },
            desc: `The reference bounds used to compute transformations.`
        };

        this.infos[this.TR_LYR_SCALE_MODE] = {
            transform: true,
            enum: ENUMS.LYR_SCALE,
            inputType: inputs.SelectInline,
            label: `Scale mode`,
            inputOptions: { catalog: ENUMS.LYR_SCALE, itemKey: nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_M },
            desc: `Scale`
        };
        this.infos[this.TR_LYR_SCALE_FACTOR] = {
            transform: true,
            inputType: inputs.NumberDrag,
            label: `Scale factor`,
            inputOptions: { min: 0.01, max: 100, step: 0.01, size: ui.FLAGS.SIZE_XS },
            desc: `Factor by which the component will be scaled.`
        };

        this.infos[this.TR_LYR_SELF_ANCHOR] = {
            transform: true,
            inputType: inputs.Anchor,
            label: `Self anchor`,
            //inputOptions: { changeOnInput: true, min: 0.01, max: 2, step: 0.01, size: ui.FLAGS.SIZE_XS },
            desc: `The component' anchor point reference for transformations.`
        };



        this.infos[this.CIRCULAR_REFERENCE] = {
            label: `Circular reference`,
            desc: `The current value creates a circular reference :(`
        };

    }

    static GLYPH_RESAMPLE_IDS = [
        this.WIDTH,
        this.HEIGHT,
        this.EXPORTED_WIDTH,
    ];

    static TR_RESAMPLE_IDS = [
        this.TR_WIDTH_SHIFT,
        this.TR_WIDTH_PUSH,
        this.TR_Y_OFFSET,
        this.TR_X_OFFSET,
        this.TR_SCALE_FACTOR,
    ];

    static LYR_RESAMPLE_IDS = [
        //this.TR_WIDTH_SHIFT,
        //this.TR_WIDTH_PUSH,
        this.TR_Y_OFFSET,
        this.TR_X_OFFSET,
    ];

    static FAMILY_RESAMPLE_IDS = [
        this.BASELINE,
        this.ASCENT,
        this.DESCENT,
        this.WIDTH,
        this.HEIGHT,
        this.X_HEIGHT,
        this.CAP_HEIGHT,
    ];

    //#endregion

    static GetInfos(p_id) {
        return p_id in this.infos ? this.infos[p_id] : null;
    }

}

module.exports = IDS;