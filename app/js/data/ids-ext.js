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
class IDS_EXT {
    constructor() { }

    static SEARCH_ENABLED = 'searchEnabled';
    static SEARCH_RESULTS = 'searchResults';
    static SEARCH_TERM = 'search';
    static ADD_COMPOSITION = 'addComp';
    static MUST_EXISTS = 'mustExists';
    static CASE_INSENSITIVE = 'broadSearch';
    static FILTER_CATEGORY = 'categories';

    static LIGA_TEXT = 'ligaSourceText';
    static LIGA_MIN = 'ligaMin';
    static LIGA_MAX = 'ligaMax';
    static LIGA_MIN_OCCURENCE = 'ligaOccMin';

    static RANGE_MIXED = 0;
    static RANGE_INLINE = 1;
    static RANGE_PLAIN = 2;

    static infos = {

        // Family properties
        [this.SEARCH_ENABLED]: {
            inputType: inputs.Boolean,
            label: `Search`,
            inputOptions: { placeholder: `...`, size:ui.FLAGS.SIZE_XS },
            desc: `Enable filter within current glyph selection.\nSeparate terms with an empty space.\nNote : search can impact responsiveness.`
        },
        [this.SEARCH_TERM]: {
            recompute:true,
            inputType: inputs.Search,
            label: `Search`,
            inputOptions: { placeholder: `search`, changeOnInput:true, submitOnChange:true,  },
            desc: `Search for characters within Unicode.\nSeparate search terms with a space.`
        },
        [this.CASE_INSENSITIVE]: {
            recompute:true,
            inputType: inputs.Checkbox,
            label: `Broad`,
            inputOptions: { placeholder: `...`, size:ui.FLAGS.SIZE_XS },
            desc: `Broad search doesn't care whether the case is uppercase or lowercase.`
        },
        [this.ADD_COMPOSITION]: {
            recompute:true,
            inputType: inputs.Checkbox,
            label: `Relatives`,
            inputOptions: { placeholder: `...`, size:ui.FLAGS.SIZE_XS },
            desc: `Whether to include glyph relatives & decompositions to initial results.\ni.e, "é" will add ' and e to the results.`
        },
        [this.MUST_EXISTS]: {
            recompute:true,
            inputType: inputs.Checkbox,
            label: `Exists`,
            inputOptions: { placeholder: `...`, size:ui.FLAGS.SIZE_XS },
            desc: `Show only glyphs existing within the font.`
        },


        
        [this.LIGA_TEXT]: {
            recompute:true,
            inputType: inputs.Textarea,
            label: `Broad`,
            inputOptions: { rows:15 },
        },
        [this.LIGA_MIN]: {
            recompute:true,
            inputType: inputs.Number,
            label: `Min length`,
            inputOptions: { size:ui.FLAGS.SIZE_XS, min:2, max:30 },
            desc: `The minimum number of siblings to look for.`
        },
        [this.LIGA_MAX]: {
            recompute:true,
            inputType: inputs.Number,
            label: `Max length`,
            inputOptions: { size:ui.FLAGS.SIZE_XS, min:3, max:30 },
            desc: `The maximum number of siblings to look for.`
        },
        [this.LIGA_MIN_OCCURENCE]: {
            recompute:true,
            inputType: inputs.Number,
            label: `Min occurences`,
            inputOptions: { size:ui.FLAGS.SIZE_XS, min:1 },
            desc: `Minimum amount of time a ligature candidate must've been found to be shown.`
        },

    }

    static GetInfos(p_id) {
        return p_id in this.infos ? this.infos[p_id] : null;
    }

}

module.exports = IDS_EXT;