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
const IDS_PREFS = {};


IDS_PREFS.MARK_COLOR = Object.freeze('markColor');
IDS_PREFS.SVG_EDITOR_PATH = Object.freeze('svgEditorPath');
IDS_PREFS.ILLU_PATH = Object.freeze('illustratorPath');

IDS_PREFS.AUTOSAVE = Object.freeze('doAutoSave');
IDS_PREFS.AUTOSAVE_TIMER = Object.freeze('autosaveTimer');

IDS_PREFS.MANUAL_PREVIEW_REFRESH_THRESHOLD = Object.freeze('manPrevRefresh');

IDS_PREFS.GROUP_DISPLAY = Object.freeze('group:display');
IDS_PREFS.GROUP_RESOURCES = Object.freeze('group:resources');
IDS_PREFS.GROUP_THIRD_PARTIES = Object.freeze('group:thirdparties');
IDS_PREFS.GROUP_DEFAULTS = Object.freeze('group:defaults');

nkm.data.RegisterDescriptors({

    [IDS_PREFS.MARK_COLOR]: {
        inputType: inputs.Color,
        label: `Mark Color`,
        inputOptions: { /* size: ui.FLAGS.SIZE_XS */ },
        desc: `Color used to find custom glyph boundaries when importing SVGs`
    },

    [IDS_PREFS.MANUAL_PREVIEW_REFRESH_THRESHOLD]: {
        inputType: inputs.Slider,
        label: `Pangram max glyph`,
        inputOptions: { min: 0, max: UNICODE.MAX_GLYPH_COUNT, /* size: ui.FLAGS.SIZE_XS */ },
        desc: `Number of glyphs within the font after which the pangram stops automatically updating the preview.\nMassive font auto-refresh can cause a serious performance hit, or simply crash the app.\nMin 0, max ${UNICODE.MAX_GLYPH_COUNT}.`
    },

    [IDS_PREFS.SVG_EDITOR_PATH]: {
        inputType: inputs.File,
        label: `SVG Editor Executable`,
        inputOptions: { placeholder: `path required`, /* size: ui.FLAGS.SIZE_XS */ },
        desc: `Path to your local Illustrator app executable.\nRequired for live editing.`
    },

    [IDS_PREFS.ILLU_PATH]: {
        inputType: inputs.File,
        label: `Illustrator Executable`,
        inputOptions: { placeholder: `path required`, /* size: ui.FLAGS.SIZE_XS */ },
        desc: `Path to your local Adobe© Illustrator app executable.\nRequired for advanced automation.`
    },

    // Groups

    [IDS_PREFS.GROUP_DISPLAY]: {
        title: `DIsplay`,
        icon: `gear`,
        desc: ``
    },
    [IDS_PREFS.GROUP_RESOURCES]: {
        title: `Resources`,
        icon: `directory-download-small`,
        desc: ``
    },
    [IDS_PREFS.GROUP_THIRD_PARTIES]: {
        title: `Third-parties`,
        icon: `link`,
        desc: ``
    },
    [IDS_PREFS.GROUP_DEFAULTS]: {
        title: `Defaults`,
        icon: `font`,
        desc: ``
    },

});



module.exports = IDS_PREFS;