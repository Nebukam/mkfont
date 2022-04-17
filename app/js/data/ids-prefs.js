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

    static infos = {};

    static MARK_COLOR = 'markColor';
    static SVG_EDITOR_PATH = 'svgEditorPath';
    static ILLU_PATH = 'illustratorPath';

    static AUTOSAVE = 'doAutoSave';
    static AUTOSAVE_TIMER = 'autosaveTimer';

    static MANUAL_PREVIEW_REFRESH_THRESHOLD = 'manPrevRefresh';

    static {

        // General 
        this.infos[this.MARK_COLOR] = {
            inputType: inputs.Color,
            label: `Mark Color`,
            inputOptions: { size: ui.FLAGS.SIZE_XXS },
            desc: `Color used to find custom glyph boundaries when importing SVGs`
        };
        this.infos[this.AUTOSAVE] = {
            inputType: inputs.Boolean,
            inputOptions: { size: ui.FLAGS.SIZE_XS },
            label: `Autosave`,
            desc: `Toggle auto-save feature on/off`
        };
        this.infos[this.AUTOSAVE_TIMER] = {
            inputType: inputs.SliderOnly,
            label: `Autosave interval`,
            inputOptions: { min: 1, max: 60, size: ui.FLAGS.SIZE_XXS },
            desc: `Interval at which the autosave triggers (in minutes).\nMin 1min, max 60min.`
        };
        this.infos[this.MANUAL_PREVIEW_REFRESH_THRESHOLD] = {
            inputType: inputs.SliderOnly,
            label: `Pangram max glyph`,
            inputOptions: { min: 0, max: 65535, size: ui.FLAGS.SIZE_XXS },
            desc: `Number of glyphs within the font after which the pangram stops automatically updating the preview.\nMassive font auto-refresh can cause a serious performance hit, or simply crash the app.\nMin 0, max 65535.`
        };

        //Third parties
        this.infos[this.SVG_EDITOR_PATH] = {
            inputType: inputs.File,
            label: `SVG Editor Executable`,
            inputOptions: { placeholder: `path required`, size: ui.FLAGS.SIZE_XS },
            desc: `Path to your local Illustrator app executable.\nRequired for live editing.`
        };
        this.infos[this.ILLU_PATH] = {
            inputType: inputs.File,
            label: `Illustrator Executable`,
            inputOptions: { placeholder: `path required`, size: ui.FLAGS.SIZE_XS },
            desc: `Path to your local Adobe© Illustrator app executable.\nRequired for advanced automation.`
        };

    }

    static GetInfos(p_id) {
        return p_id in this.infos ? this.infos[p_id] : null;
    }

}

module.exports = IDS_EXT;