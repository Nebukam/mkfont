const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

class FamilyInspector extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    static __controls = [
        { cl:mkfWidgets.ControlHeader, options:{ label:`Definition` } },
        { options: { propertyId: mkfData.IDS.FAMILY } },
        { options:{ propertyId:mkfData.IDS.FONT_STYLE, subData:`selectedSubFamily` } },
        { options:{ propertyId:mkfData.IDS.WEIGHT_CLASS, subData:`selectedSubFamily` } },
        { cl:mkfWidgets.ControlHeader, options:{ label:`Infos` } },
        { options: { propertyId: mkfData.IDS.COPYRIGHT } },
        { options: { propertyId: mkfData.IDS.METADATA } },
        { options: { propertyId: mkfData.IDS.DESCRIPTION } },
        { options: { propertyId: mkfData.IDS.URL } },
        { options: { propertyId: mkfData.IDS.VERSION } },
        //{ options: { propertyId: mkfData.IDS.COLOR_PREVIEW } },
    ];

    _Init() {
        super._Init();
        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'flex': '0 0 auto',
                'min-width': '300px'
            },
            '.list': {
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'flex': '1 1 auto',
                'min-height': '0',
                'overflow': 'auto',
                'padding': '10px',
            },
            '.control': {
                'flex': '0 1 auto',
                'margin-bottom': '5px'
            }
        }, super._Style());
    }

    _Render() {

        this._body = ui.dom.El(`div`, { class: `list` }, this._host);
        this._builder.host = this._body;


        super._Render();

        // Preview align mode (left/center/right)

        // ...

    }

    //#region Family properties

    _PreprocessData(p_data) {
        if (!nkm.utils.isInstanceOf(p_data, mkfData.Family)) { return null; }
        return p_data;
    }

    //#endregion


}

module.exports = FamilyInspector;
ui.Register(`mkf-family-explorer`, FamilyInspector);