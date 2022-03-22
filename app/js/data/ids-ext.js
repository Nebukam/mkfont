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
            inputType: inputs.Checkbox,
            label: `Enable search`,
            inputOptions: { placeholder: `...` },
            desc: `Enable search within glyph.\nMakes everything slower!`
        },
        [this.SEARCH_TERM]: {
            inputType: inputs.Text,
            label: `Search`,
            inputOptions: { placeholder: `...` },
            desc: `Search for characters within Unicode.\nSeparate search terms with a space.`
        },
        [this.SHOW_DECOMPOSITION]: {
            inputType: inputs.Checkbox,
            label: `Decomposition`,
            inputOptions: { placeholder: `...` },
            desc: `Whether to include glyph relatives & decompositions to initial results.`
        },
    }

    static GetInfos(p_id) {
        return p_id in this.infos ? this.infos[p_id] : null;
    }

}

module.exports = IDS_EXT;