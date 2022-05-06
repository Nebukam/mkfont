'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

const base = nkm.datacontrols.InspectorView;
class FamilyInspector extends base {
    constructor() { super(); }

    static __controls = [
        { cl:mkfWidgets.ControlHeader, options:{ label:`Definition` } },
        { options: { propertyId: mkfData.IDS.FAMILY } },
        { options:{ propertyId:mkfData.IDS.FONT_STYLE } },
        { options:{ propertyId:mkfData.IDS.WEIGHT_CLASS } },
        { cl:mkfWidgets.ControlHeader, options:{ label:`Infos` } },
        { options: { propertyId: mkfData.IDS.COPYRIGHT } },
        //{ options: { propertyId: mkfData.IDS.METADATA } },
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
            '.control': {
                'flex': '0 1 auto',
                'margin': '0',
                'margin-bottom': '5px'
            }
        }, base._Style());
    }

    _Render() {

        this._body = ui.dom.El(`div`, { class: `list` }, this._host);
        this._builder.host = this._body;

        super._Render();

        // Preview align mode (left/center/right)

        // ...

    }

    //#region Family properties

    //#endregion


}

module.exports = FamilyInspector;
ui.Register(`mkf-family-explorer`, FamilyInspector);