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
    static SHOW_DECOMPOSITION = 'decomposition';
    static FILTER_ONLY_EXISTING = 'existingOnly';
    static FILTER_CATEGORY = 'categories';

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
            inputOptions: { placeholder: `search` },
            desc: `Search for characters within Unicode.\nSeparate search terms with a space.`
        },
        [this.SHOW_DECOMPOSITION]: {
            recompute:true,
            inputType: inputs.Checkbox,
            label: `Decomp`,
            inputOptions: { placeholder: `...`, size:ui.FLAGS.SIZE_XS },
            desc: `Whether to include glyph relatives & decompositions to initial results.\ni.e, "é" will add ' and e to the results.`
        },
        [this.FILTER_ONLY_EXISTING]: {
            recompute:true,
            inputType: inputs.Checkbox,
            label: `Exists`,
            inputOptions: { placeholder: `...`, size:ui.FLAGS.SIZE_XS },
            desc: `Show only existing glyphs.`
        },
    }

    static GetInfos(p_id) {
        return p_id in this.infos ? this.infos[p_id] : null;
    }

}

module.exports = IDS_EXT;