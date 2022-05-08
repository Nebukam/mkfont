const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const mkfData = require(`../data`);
const mkfWidgets = require(`../widgets`);

const isAutoSave = (owner) => { return owner.data ? owner.data.Get(mkfData.IDS_PREFS.AUTOSAVE) : true; };

const base = uilib.overlays.ControlDrawer;
class PrefsExplorer extends base {
    constructor() { super(); }

    static __controls = [];

    _Init() {
        super._Init();
        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                'min-width': '350px',
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
            },
            '.drawer': {
                'flex': '1 1 auto',
                'width': `350px`,
                'padding': `10px`,
                'background-color': `rgba(19, 19, 19, 0.15)`,
                'border-radius': '4px',
                'margin-bottom': '5px',
            }
        }, base._Style());
    }

    _Render() {

        super._Render();

        this._Foldout(
            { title: `Autosave`, icon: `save`, prefId: `appsettings.autosave`, expanded: true },
            [
                { options: { propertyId: mkfData.IDS_PREFS.AUTOSAVE, invertInputOrder:true } },
                { options: { propertyId: mkfData.IDS_PREFS.AUTOSAVE_TIMER }, disableWhen: { fn: isAutoSave } },
            ]
        );

        this._Foldout(
            { title: `Display`, icon: `gear`, prefId: `appsettings.display`, expanded: true },
            [
                { options: { propertyId: mkfData.IDS_PREFS.MANUAL_PREVIEW_REFRESH_THRESHOLD } },
            ]
        );

        this._Foldout(
            { title: `Resources`, icon: `directory-download-small`, prefId: `appsettings.rsc`, expanded: true },
            [
                { options: { propertyId: mkfData.IDS_EXT.IMPORT_BIND_RESOURCE, invertInputOrder:true } },
                { options: { propertyId: mkfData.IDS_PREFS.MARK_COLOR } },
            ]
        );

        this._Foldout(
            { title: `Third-parties`, icon: `link`, prefId: `appsettings.third`, expanded: true },
            [
                { options: { propertyId: mkfData.IDS_PREFS.SVG_EDITOR_PATH } },
                { options: { propertyId: mkfData.IDS_PREFS.ILLU_PATH } },
            ]
        );

        this._Foldout(
            { title: `Defaults`, icon: `font`, prefId: `appsettings.font`, expanded: true },
            [
                { options: { propertyId: mkfData.IDS.FAMILY } },
                { options: { propertyId: mkfData.IDS.COPYRIGHT } },
                { options: { propertyId: mkfData.IDS.DESCRIPTION } },
                { options: { propertyId: mkfData.IDS.URL } },
                { options: { propertyId: mkfData.IDS.PREVIEW_SIZE } },
            ]
        );

    }

    _Foldout(p_foldout, p_controls, p_css = ``, p_host = null) {

        let foldout = this.Attach(nkm.uilib.widgets.Foldout, `item drawer${p_css ? ' ' + p_css : ''}`, p_host || this);
        foldout.options = p_foldout;

        if (p_controls) {
            let builder = new nkm.datacontrols.helpers.ControlBuilder(this);
            builder.options = { host: foldout, cl: mkfWidgets.PropertyControl, css: `foldout-item full` };
            this.forwardData.To(builder);
            builder.Build(p_controls);
        }

        return foldout;

    }

    //#region Family properties

    //#endregion


}

module.exports = PrefsExplorer;
ui.Register(`mkf-prefs-explorer`, PrefsExplorer);