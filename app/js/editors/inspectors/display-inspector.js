'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

const base = nkm.datacontrols.InspectorView;
class DisplayInspector extends base {
    constructor() { super(); }

    static __controls = [
        { cl: mkfWidgets.ControlHeader, options: { label: `Display options` } },
        //{ options: { propertyId: mkfData.IDS.COLOR_PREVIEW } },
        {
            options: {
                propertyId: mkfData.IDS.PREVIEW_SIZE, 
                onSubmit: (p_input, p_id, p_value) => {
                    let editor = nkm.datacontrols.FindEditor(p_input);
                    editor.data.Set(p_id, p_value);
                }
            }
        },
    ];

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
            '.control': {
                'flex': '0 1 auto',
                'margin-bottom': '5px'
            }
        }, base._Style());
    }

    _Render() {

        this._body = ui.dom.El(`div`, { class: `list` }, this._host);
        this._builder.host = this._body;

        super._Render();

        this._controls = ui.dom.El("div", { class: 'controls' }, this._body);


        // Preview align mode (left/center/right)

        // ...

    }



    //#region Family properties

    //#endregion


}

module.exports = DisplayInspector;
ui.Register(`mkf-display-inspector`, DisplayInspector);