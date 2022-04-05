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

    static MARK_COLOR = 'markColor';
    static SVG_EDITOR_PATH = 'svgEditorPath';
    static ILLU_PATH = 'illustratorPath';

    static infos = {

        // General 
        [this.MARK_COLOR]: {
            inputType: inputs.Color,
            label: `Mark Color`,
            inputOptions: { size: ui.FLAGS.SIZE_XS },
            desc: `Color used to find custom glyph boundaries when importing SVGs`
        },

        //Third parties
        [this.SVG_EDITOR_PATH]: {
            inputType: inputs.File,
            label: `SVG Editor Executable`,
            inputOptions: { placeholder: `path required`, size: ui.FLAGS.SIZE_XS },
            desc: `Path to your local Illustrator app executable.\nRequired for live editing.`
        },
        [this.ILLU_PATH]: {
            inputType: inputs.File,
            label: `Illustrator Executable`,
            inputOptions: { placeholder: `path required`, size: ui.FLAGS.SIZE_XS },
            desc: `Path to your local Adobe© Illustrator app executable.\nRequired for advanced automation.`
        },

    }

    static GetInfos(p_id) {
        return p_id in this.infos ? this.infos[p_id] : null;
    }

}

module.exports = IDS_EXT;