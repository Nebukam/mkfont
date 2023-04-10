'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;

const UNICODE = require(`../unicode`);

/**
 * @description TODO
 * @class
 * @hideconstructor
 * @memberof ui.core
 */
class IDS_PREFS {
    constructor() { }

    static infos = {};

    static MARK_COLOR = Object.freeze('markColor');
    static SVG_EDITOR_PATH = Object.freeze('svgEditorPath');
    static ILLU_PATH = Object.freeze('illustratorPath');

    static AUTOSAVE = Object.freeze('doAutoSave');
    static AUTOSAVE_TIMER = Object.freeze('autosaveTimer');

    static MANUAL_PREVIEW_REFRESH_THRESHOLD = Object.freeze('manPrevRefresh');

    static GROUP_DISPLAY = Object.freeze('group:display');
    static GROUP_RESOURCES = Object.freeze('group:resources');
    static GROUP_THIRD_PARTIES = Object.freeze('group:thirdparties');
    static GROUP_DEFAULTS = Object.freeze('group:defaults');
    

    static {
        nkm.data.RegisterDescriptors({

            [this.MARK_COLOR]: {
                inputType: inputs.Color,
                label: `Mark Color`,
                inputOptions: { size: ui.FLAGS.SIZE_XXS },
                desc: `Color used to find custom glyph boundaries when importing SVGs`
            },

            /*
            [this.AUTOSAVE]: {
                inputType: inputs.Boolean,
                inputOptions: { size: ui.FLAGS.SIZE_XS },
                label: `Autosave`,
                desc: `Toggle auto-save feature on/off`
            },

            [this.AUTOSAVE_TIMER]: {
                inputType: inputs.Slider,
                label: `Autosave interval`,
                inputOptions: { min: 1, max: 60, size: ui.FLAGS.SIZE_XS },
                desc: `Interval at which the autosave triggers (in minutes).\nMin 1min, max 60min.`
            },
            */

            [this.MANUAL_PREVIEW_REFRESH_THRESHOLD]: {
                inputType: inputs.Slider,
                label: `Pangram max glyph`,
                inputOptions: { min: 0, max: UNICODE.MAX_GLYPH_COUNT, size: ui.FLAGS.SIZE_XS },
                desc: `Number of glyphs within the font after which the pangram stops automatically updating the preview.\nMassive font auto-refresh can cause a serious performance hit, or simply crash the app.\nMin 0, max ${UNICODE.MAX_GLYPH_COUNT}.`
            },

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

            // Groups

            [this.GROUP_DISPLAY]: {
                title: `DIsplay`,
                icon: `gear`,
                desc: ``
            },
            [this.GROUP_RESOURCES]: {
                title: `Resources`,
                icon: `directory-download-small`,
                desc: ``
            },
            [this.GROUP_THIRD_PARTIES]: {
                title: `Third-parties`,
                icon: `link`,
                desc: ``
            },
            [this.GROUP_DEFAULTS]: {
                title: `Defaults`,
                icon: `font`,
                desc: ``
            },

        });
    }

    static GetInfos(p_id) {
        return p_id in this.infos ? this.infos[p_id] : null;
    }

}

module.exports = IDS_PREFS;