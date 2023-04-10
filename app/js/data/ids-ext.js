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
class IDS_EXT {
    constructor() { }

    static infos = {};

    //#region search
    static ADD_COMPOSITION = Object.freeze('addComp');
    static MUST_EXISTS = Object.freeze('mustExists');
    static FILTER_CATEGORY = Object.freeze('categories');

    static {
        nkm.data.RegisterDescriptors({

            [this.ADD_COMPOSITION]: {
                recompute: true,
                inputType: inputs.Checkbox,
                label: `Relatives`,
                inputOptions: { placeholder: `...`, size: ui.FLAGS.SIZE_XS },
                desc: `Whether to include glyph relatives & decompositions to initial results.\ni.e, "é" will add ' and e to the results.`
            },

            [this.MUST_EXISTS]: {
                recompute: true,
                inputType: inputs.Checkbox,
                label: `Exists`,
                inputOptions: { placeholder: `...`, size: ui.FLAGS.SIZE_XS },
                desc: `Show only glyphs existing within the font.`
            },

        });
    }

    //#endregion

    //#region Import

    static IMPORT_ASSIGN_MODE = Object.freeze('import-assign-mode');
    static IMPORT_OVERLAP_MODE = Object.freeze('import-overlap-mode');

    static IMPORT_PREFIX = Object.freeze('import-prefix');
    static IMPORT_SEPARATOR = Object.freeze('import-sep');
    static IMPORT_MARK_X = Object.freeze('import-x');
    static IMPORT_MARK_CAP = Object.freeze('import-cap');
    static IMPORT_MARK_COL = Object.freeze('import-col');

    static IMPORT_BLOCK = Object.freeze('import-block');
    static IMPORT_BLOCK_START = Object.freeze('import-block-start');

    static IMPORT_JUMP_OVER = Object.freeze('import-jump-over');

    static IMPORT_BIND_RESOURCE = Object.freeze('import-bind');
    static IMPORT_TEXT_AS_LAYERS = Object.freeze('import-text-as-layers');

    static {
        nkm.data.RegisterDescriptors({

            [this.IMPORT_ASSIGN_MODE]: {
                import: true,
                enum: ENUMS.ASSIGN_IMPORT_MODE,
                inputType: inputs.Select,
                label: `Assignation`,
                inputOptions: { catalog: ENUMS.ASSIGN_IMPORT_MODE, itemKey: nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_S },
                desc: `How the imported file is associated to a Unicode value.`
            },

            [this.IMPORT_OVERLAP_MODE]: {
                import: true,
                enum: ENUMS.OVERLAP,
                inputType: inputs.Select,
                label: `Overlap`,
                inputOptions: { catalog: ENUMS.OVERLAP, itemKey: nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_S },
                desc: `How deal with glyphs that already exists.`
            },

            [this.IMPORT_BLOCK]: {
                import: true,
                enum: UNICODE.instance._blockCatalog,
                inputType: inputs.Select,
                label: `Reference block`,
                inputOptions: { catalog: UNICODE.instance._blockCatalog, size: ui.FLAGS.SIZE_S },
                desc: `UNICODE Block to work with (there's ${UNICODE.instance._blockCatalog.count} of them!)`
            },

            [this.IMPORT_BLOCK_START]: {
                import: true,
                enum: ENUMS.BLOCK_START_MODE,
                inputType: inputs.Select,
                label: `Start point`,
                inputOptions: { catalog: ENUMS.BLOCK_START_MODE, itemKey: nkm.com.IDS.VALUE, size: ui.FLAGS.SIZE_S },
                desc: `Where to start adding within the selected block`
            },

            [this.IMPORT_JUMP_OVER]: {
                import: true,
                inputType: inputs.Boolean,
                label: `Search`,
                inputOptions: { placeholder: `...`, size: ui.FLAGS.SIZE_XS },
            },

            [this.IMPORT_BIND_RESOURCE]: {
                import: true,
                inputType: inputs.Boolean,
                label: `Bind imported files`,
                inputOptions: { placeholder: `...`, size: ui.FLAGS.SIZE_XS },
                desc: `Imported files will become bound to their glyphs.\nThis means that each time the files are updated outside the app, the glyph will be re-imported.\nNote that you remove that binding at any time.`,
            },

            [this.IMPORT_TEXT_AS_LAYERS]: {
                import: true,
                inputType: inputs.Boolean,
                label: `Text as components`,
                inputOptions: { placeholder: `...`, size: ui.FLAGS.SIZE_XS },
                desc: `When enabled, text element within the SVG will create components named after that text' content.`,
            },

            [this.IMPORT_PREFIX]: {
                import: true,
                inputType: inputs.Text,
                label: `Name prefix`,
                desc: `Prefix used to check where the unicode definition starts in the filename.\nThe prefix and all characters before will be ignored.`
            },

            [this.IMPORT_SEPARATOR]: {
                import: true,
                inputType: inputs.Text,
                label: `Separator`,
                desc: `Separator character in filenames.\nUsed to separate unicode values\ni.e char_U+0000, char_U+0000_U+0000, char_l_i_g_a`
            },

            [this.IMPORT_MARK_X]: {
                import: true,
                inputType: inputs.Text,
                label: `X hint`,
                desc: `A string of text that, if found in the file name, will scale the glyph to X-Height instead of selected default.`
            },

            [this.IMPORT_MARK_CAP]: {
                import: true,
                inputType: inputs.Text,
                label: `Cap hint`,
                desc: `A string of text that, if found in the file name, will scale the glyph to Cap-Height instead of selected default.`
            },

            [this.IMPORT_MARK_COL]: {
                import: true,
                inputType: inputs.Color,
                label: `Bounds color`,
                desc: `Color used inside the imported SVG to 'mark' its special boundaries.\nSee online help for more about special boundaries.`
            },

        });
    }

    //#endregion

    //#region Ligatures

    static LIGA_TEXT = Object.freeze('ligaSourceText');
    static LIGA_MIN = Object.freeze('ligaMin');
    static LIGA_MAX = Object.freeze('ligaMax');
    static LIGA_MIN_OCCURENCE = Object.freeze('ligaOccMin');
    static LIGA_EACH_LINE = Object.freeze('ligaEachLine');

    static RANGE_MIXED = 0;
    static RANGE_INLINE = 1;
    static RANGE_PLAIN = 2;

    static {
        nkm.data.RegisterDescriptors({

            [this.LIGA_TEXT]: {
                recompute: true,
                inputType: inputs.Textarea,
                label: `Broad`,
                inputOptions: { rows: 15 },
            },

            [this.LIGA_MIN]: {
                recompute: true,
                inputType: inputs.NumberDrag,
                label: `Min length`,
                inputOptions: { size: ui.FLAGS.SIZE_XS, min: 2, max: 30 },
                desc: `The minimum number of siblings to look for.`
            },

            [this.LIGA_MAX]: {
                recompute: true,
                inputType: inputs.NumberDrag,
                label: `Max length`,
                inputOptions: { size: ui.FLAGS.SIZE_XS, min: 3, max: 30 },
                desc: `The maximum number of siblings to look for.`
            },

            [this.LIGA_MIN_OCCURENCE]: {
                recompute: true,
                inputType: inputs.NumberDrag,
                label: `Min occurences`,
                inputOptions: { size: ui.FLAGS.SIZE_XS, min: 1 },
                desc: `Minimum amount of time a ligature candidate must've been found to be shown.`
            },

            [this.LIGA_EACH_LINE]: {
                recompute: true,
                inputType: inputs.Boolean,
                label: `Each line is a ligature`,
                inputOptions: { size: ui.FLAGS.SIZE_XS },
                desc: `When enabled, each new line is considered as a valid ligature candidate.`
            },

        });
    }

    //#endregion

    static GetInfos(p_id) {
        return p_id in this.infos ? this.infos[p_id] : null;
    }

}

module.exports = IDS_EXT;