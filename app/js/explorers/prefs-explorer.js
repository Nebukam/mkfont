const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const mkfData = require(`../data`);
const mkfWidgets = require(`../widgets`);

const isAutoSave = (owner) => { return owner.data ? owner.data.Get(mkfData.IDS_PREFS.AUTOSAVE) : true; };

const base = uilib.overlays.ControlDrawer;
class PrefsExplorer extends base {
    constructor() { super(); }

    static __controls = [
        
        { cl:mkfWidgets.ControlHeader, options:{ label:`-` }, css:`separator` },
        { cl:mkfWidgets.ControlHeader, options:{ label:`Autosave` }, css:`separator` },
        { options: { propertyId: mkfData.IDS_PREFS.AUTOSAVE } },
        { options: { propertyId: mkfData.IDS_PREFS.AUTOSAVE_TIMER }, disableWhen: { fn: isAutoSave } },

        { cl:mkfWidgets.ControlHeader, options:{ label:`-` }, css:`separator` },
        { cl:mkfWidgets.ControlHeader, options:{ label:`Performance & display` }, css:`separator` },
        { options: { propertyId: mkfData.IDS_PREFS.MANUAL_PREVIEW_REFRESH_THRESHOLD } },

        { cl:mkfWidgets.ControlHeader, options:{ label:`-` }, css:`separator` },
        { cl:mkfWidgets.ControlHeader, options:{ label:`Import` }, css:`separator` },
        { options: { propertyId: mkfData.IDS_EXT.IMPORT_BIND_RESOURCE } },
        { options: { propertyId: mkfData.IDS_PREFS.MARK_COLOR } },

        { cl:mkfWidgets.ControlHeader, options:{ label:`-` }, css:`separator` },
        { cl:mkfWidgets.ControlHeader, options:{ label:`Third parties` }, css:`separator` },
        { options: { propertyId: mkfData.IDS_PREFS.SVG_EDITOR_PATH } },
        { options: { propertyId: mkfData.IDS_PREFS.ILLU_PATH } },

        { cl:mkfWidgets.ControlHeader, options:{ label:`-` }, css:`separator` },
        { cl:mkfWidgets.ControlHeader, options:{ label:`Family Defaults` }, css:`separator` },
        { options: { propertyId: mkfData.IDS.FAMILY } },
        { options: { propertyId: mkfData.IDS.COPYRIGHT } },
        { options: { propertyId: mkfData.IDS.DESCRIPTION } },
        { options: { propertyId: mkfData.IDS.URL } },
        { options: { propertyId: mkfData.IDS.PREVIEW_SIZE } },
    ];

    _Init() {
        super._Init();
        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                'min-width':'350px',
                //'flex': '0 0 auto',
            },
            '.list': {
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'flex': '1 1 auto',
                'min-height': '0',
                'overflow': 'auto',
                'padding': '10px',
            },
            '.body': {
                'padding': `20px 20px`,
            },
            '.control': {
                'flex': '0 1 auto',
                'margin-bottom': '5px'
            },
            '.separator': {
                //'border-top':'1px solid gray'
            }
        }, base._Style());
    }

    _Render() {
        super._Render();

        // Preview align mode (left/center/right)

        // ...

    }

    //#region Family properties

    //#endregion


}

module.exports = PrefsExplorer;
ui.Register(`mkf-prefs-explorer`, PrefsExplorer);