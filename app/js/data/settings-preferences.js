'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.u;
const io = nkm.io;

const SimpleDataEx = require(`./simple-data-ex`);
const IDS = require(`./ids`);
const IDS_EXT = require(`./ids-ext`);
const IDS_PREFS = require(`./ids-prefs`);
const ENUMS = require(`./enums`);

class PreferencesSettingsDataBlock extends SimpleDataEx {
    constructor() { super(); }

    static __signalValueMap = {
        [IDS_PREFS.AUTOSAVE]: IDS_PREFS.AUTOSAVE,
        [IDS_PREFS.AUTOSAVE_TIMER]: IDS_PREFS.AUTOSAVE_TIMER,
    };

    static __NFO__ = {
        [nkm.com.IDS.UID]: `@mkf:prefs-data-block`,
        [nkm.com.IDS.ICON]: `gear`
    };

    _Init() {

        super._Init();

    }

    _ResetValues(p_values) {

        p_values[IDS_PREFS.MARK_COLOR] = { value: `#FF00FF` };

        p_values[IDS_PREFS.SVG_EDITOR_PATH] = { value: `` };
        p_values[IDS_PREFS.ILLU_PATH] = { value: `` };

        p_values[IDS_PREFS.AUTOSAVE] = { value: false };
        p_values[IDS_PREFS.AUTOSAVE_TIMER] = { value: 10 };
        p_values[IDS_PREFS.MANUAL_PREVIEW_REFRESH_THRESHOLD] = { value: 5000 };

        p_values[IDS_EXT.IMPORT_BIND_RESOURCE] = { value: true };

        p_values[IDS.FAMILY] = { value: `New MKFont` };
        p_values[IDS.COPYRIGHT] = { value: `(c) mkfont 2022` };
        p_values[IDS.DESCRIPTION] = { value: `Made with mkfont` };
        p_values[IDS.URL] = { value: `https://github.com/Nebukam/mkfont` };
        p_values[IDS.COLOR_PREVIEW] = { value: `#f5f5f5` };
        p_values[IDS.PREVIEW_SIZE] = { value: 70 };

    }



}

module.exports = PreferencesSettingsDataBlock;