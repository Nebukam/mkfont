'use strict';

const nkm = require(`@nkmjs/core`);
const ENUMS = require("./enums");
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;

const IDS = require(`./ids`);
const IDS_EXT = require(`./ids-ext`);
const IDS_PREFS = require(`./ids-prefs`);

const base = nkm.app.AppSettings;
class AppSettings extends base {
    constructor() { super(); }

    static __VALUES = this.Ext(base.__VALUES, {

        [IDS_PREFS.SVG_EDITOR_PATH]: { value: ``, group: IDS_PREFS.GROUP_THIRD_PARTIES },
        [IDS_PREFS.ILLU_PATH]: { value: ``, group: IDS_PREFS.GROUP_THIRD_PARTIES },

        [IDS_PREFS.MANUAL_PREVIEW_REFRESH_THRESHOLD]: { value: 5000, group: IDS_PREFS.GROUP_DISPLAY },

        [IDS_PREFS.MARK_COLOR]: { value: `#FF00FF`, group: IDS_PREFS.GROUP_RESOURCES },
        [IDS_EXT.IMPORT_BIND_RESOURCE]: { value: true, group: IDS_PREFS.GROUP_RESOURCES },

        [IDS.FAMILY]: { value: `New MKFont`, group: IDS_PREFS.GROUP_DEFAULTS },
        [IDS.COPYRIGHT]: { value: `(c) mkfont 2023`, group: IDS_PREFS.GROUP_DEFAULTS },
        [IDS.DESCRIPTION]: { value: `Made with mkfont`, group: IDS_PREFS.GROUP_DEFAULTS },
        [IDS.URL]: { value: `https://github.com/Nebukam/mkfont`, group: IDS_PREFS.GROUP_DEFAULTS },
        [IDS.COLOR_PREVIEW]: { value: `#f5f5f5`, group: IDS_PREFS.GROUP_DEFAULTS },
        [IDS.PREVIEW_SIZE]: { value: 70, group: IDS_PREFS.GROUP_DEFAULTS },

    });

    _Init() {
        super._Init();
    }

}

module.exports = AppSettings;