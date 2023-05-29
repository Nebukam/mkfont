'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;

const ENUMS = require(`./enums`);
const UNICODE = require(`../unicode`);

/**
 * @description TODO
 * @class
 * @hideconstructor
 * @memberof ui.core
 */
const IDS_EXT = {};

//#region search
IDS_EXT.ADD_COMPOSITION = Object.freeze('addComp');
IDS_EXT.MUST_EXISTS = Object.freeze('mustExists');
IDS_EXT.FILTER_CATEGORY = Object.freeze('categories');

nkm.data.RegisterDescriptors({

    [IDS_EXT.ADD_COMPOSITION]: {
        recompute: true,
        inputType: inputs.Checkbox,
        label: `Relatives`,
        inputOptions: { placeholder: `...`, size: ui.FLAGS.SIZE_XS },
        desc: `Whether to include glyph relatives & decompositions to initial results.\ni.e, "é" will add ' and e to the results.`
    },

    [IDS_EXT.MUST_EXISTS]: {
        recompute: true,
        inputType: inputs.Checkbox,
        label: `Exists`,
        inputOptions: { placeholder: `...`, size: ui.FLAGS.SIZE_XS },
        desc: `Show only glyphs existing within the font.`
    },

});


//#endregion

//#region Import

IDS_EXT.IMPORT_ASSIGN_MODE = Object.freeze('import-assign-mode');
IDS_EXT.IMPORT_OVERLAP_MODE = Object.freeze('import-overlap-mode');

IDS_EXT.IMPORT_PREFIX = Object.freeze('import-prefix');
IDS_EXT.IMPORT_SEPARATOR = Object.freeze('import-sep');
IDS_EXT.IMPORT_MARK_X = Object.freeze('import-x');
IDS_EXT.IMPORT_MARK_CAP = Object.freeze('import-cap');
IDS_EXT.IMPORT_MARK_COL = Object.freeze('import-col');

IDS_EXT.IMPORT_BLOCK = Object.freeze('import-block');
IDS_EXT.IMPORT_BLOCK_START = Object.freeze('import-block-start');

IDS_EXT.IMPORT_JUMP_OVER = Object.freeze('import-jump-over');

IDS_EXT.IMPORT_BIND_RESOURCE = Object.freeze('import-bind');
IDS_EXT.IMPORT_TEXT_AS_LAYERS = Object.freeze('import-text-as-layers');

nkm.data.RegisterDescriptors({

    [IDS_EXT.IMPORT_ASSIGN_MODE]: {
        import: true,
        enum: ENUMS.ASSIGN_IMPORT_MODE,
        inputType: inputs.Select,
        label: `Assignation`,
        inputOptions: { catalog: ENUMS.ASSIGN_IMPORT_MODE, itemKey: nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_S },
        desc: `How the imported file is associated to a Unicode value.`
    },

    [IDS_EXT.IMPORT_OVERLAP_MODE]: {
        import: true,
        enum: ENUMS.OVERLAP,
        inputType: inputs.Select,
        label: `Overlap`,
        inputOptions: { catalog: ENUMS.OVERLAP, itemKey: nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_S },
        desc: `How deal with glyphs that already exists.`
    },

    [IDS_EXT.IMPORT_BLOCK]: {
        import: true,
        enum: UNICODE._blockCatalog,
        inputType: inputs.Select,
        label: `Reference block`,
        inputOptions: { catalog: UNICODE._blockCatalog, size: ui.FLAGS.SIZE_S },
        desc: `UNICODE Block to work with (there's ${UNICODE._blockCatalog.length} of them!)`
    },

    [IDS_EXT.IMPORT_BLOCK_START]: {
        import: true,
        enum: ENUMS.BLOCK_START_MODE,
        inputType: inputs.Select,
        label: `Start point`,
        inputOptions: { catalog: ENUMS.BLOCK_START_MODE, itemKey: nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_S },
        desc: `Where to start adding within the selected block`
    },

    [IDS_EXT.IMPORT_JUMP_OVER]: {
        import: true,
        valueType:nkm.data.TYPES.BOOLEAN,
        label: `Search`,
        inputOptions: { placeholder: `...`, size: ui.FLAGS.SIZE_XS },
    },

    [IDS_EXT.IMPORT_BIND_RESOURCE]: {
        import: true,
        valueType:nkm.data.TYPES.BOOLEAN,
        label: `Bind imported files`,
        inputOptions: { placeholder: `...`, size: ui.FLAGS.SIZE_XS },
        desc: `Imported files will become bound to their glyphs.\nIDS_EXT means that each time the files are updated outside the app, the glyph will be re-imported.\nNote that you remove that binding at any time.`,
    },

    [IDS_EXT.IMPORT_TEXT_AS_LAYERS]: {
        import: true,
        valueType:nkm.data.TYPES.BOOLEAN,
        label: `Text as components`,
        inputOptions: { placeholder: `...`, size: ui.FLAGS.SIZE_XS },
        desc: `When enabled, text element within the SVG will create components named after that text' content.`,
    },

    [IDS_EXT.IMPORT_PREFIX]: {
        import: true,
        inputType: inputs.Text,
        label: `Name prefix`,
        desc: `Prefix used to check where the unicode definition starts in the filename.\nThe prefix and all characters before will be ignored.`
    },

    [IDS_EXT.IMPORT_SEPARATOR]: {
        import: true,
        inputType: inputs.Text,
        label: `Separator`,
        desc: `Separator character in filenames.\nUsed to separate unicode values\ni.e char_U+0000, char_U+0000_U+0000, char_l_i_g_a`
    },

    [IDS_EXT.IMPORT_MARK_X]: {
        import: true,
        inputType: inputs.Text,
        label: `X hint`,
        desc: `A string of text that, if found in the file name, will scale the glyph to X-Height instead of selected default.`
    },

    [IDS_EXT.IMPORT_MARK_CAP]: {
        import: true,
        inputType: inputs.Text,
        label: `Cap hint`,
        desc: `A string of text that, if found in the file name, will scale the glyph to Cap-Height instead of selected default.`
    },

    [IDS_EXT.IMPORT_MARK_COL]: {
        import: true,
        inputType: inputs.Color,
        label: `Bounds color`,
        desc: `Color used inside the imported SVG to 'mark' its special boundaries.\nSee online help for more about special boundaries.`
    },

});


//#endregion

//#region Ligatures

IDS_EXT.LIGA_TEXT = Object.freeze('ligaSourceText');
IDS_EXT.LIGA_MIN = Object.freeze('ligaMin');
IDS_EXT.LIGA_MAX = Object.freeze('ligaMax');
IDS_EXT.LIGA_MIN_OCCURENCE = Object.freeze('ligaOccMin');
IDS_EXT.LIGA_EACH_LINE = Object.freeze('ligaEachLine');

IDS_EXT.RANGE_MIXED = 0;
IDS_EXT.RANGE_INLINE = 1;
IDS_EXT.RANGE_PLAIN = 2;

nkm.data.RegisterDescriptors({

    [IDS_EXT.LIGA_TEXT]: {
        recompute: true,
        inputType: inputs.Textarea,
        label: `Broad`,
        inputOptions: { rows: 15 },
    },

    [IDS_EXT.LIGA_MIN]: {
        recompute: true,
        inputType: inputs.NumberDrag,
        label: `Min length`,
        inputOptions: { min: 2, max: 30, /* size: ui.FLAGS.SIZE_XS */ },
        desc: `The minimum number of siblings to look for.`
    },

    [IDS_EXT.LIGA_MAX]: {
        recompute: true,
        inputType: inputs.NumberDrag,
        label: `Max length`,
        inputOptions: { min: 3, max: 30, /* size: ui.FLAGS.SIZE_XS */ },
        desc: `The maximum number of siblings to look for.`
    },

    [IDS_EXT.LIGA_MIN_OCCURENCE]: {
        recompute: true,
        inputType: inputs.NumberDrag,
        label: `Min occurences`,
        inputOptions: { min: 1, /* size: ui.FLAGS.SIZE_XS */ },
        desc: `Minimum amount of time a ligature candidate must've been found to be shown.`
    },

    [IDS_EXT.LIGA_EACH_LINE]: {
        recompute: true,
        valueType:nkm.data.TYPES.BOOLEAN,
        label: `Each line is a ligature`,
        inputOptions: { size: ui.FLAGS.SIZE_XS },
        desc: `When enabled, each new line is considered as a valid ligature candidate.`
    },

});


//#endregion


module.exports = IDS_EXT;