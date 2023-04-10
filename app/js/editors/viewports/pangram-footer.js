'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfInspectors = require(`../inspectors`);
const mkfOperations = require(`../../operations`);

const base = nkm.datacontrols.ControlView;
class PangramFooter extends base {
    constructor() { super(); }

    static __controls = [
        {
            options: {
                propertyId: mkfData.IDS.PREVIEW_SIZE,
                onSubmit: (p_input, p_id, p_value) => {
                    let editor = nkm.datacontrols.FindEditor(p_input);
                    editor.data.Set(p_id, p_value);
                },
                inputOnly: true
            },
            css:`slider`
        },
    ];

    _Init() {
        super._Init();
        this._builder.defaultControlClass = nkm.datacontrols.widgets.ValueControl;
        this._builder.defaultCSS = `control`;
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                'min-height': 'auto',
                'padding': '10px 20px',
                'overflow': 'clip'
            },
            '.title': {
                'margin-bottom': '10px'
            },
            '.control': {

            },
            '.slider': {
                'width':`100px`
            }
        }, base._Style());
    }

    _Render() {
        super._Render();
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        //this._title.Set(p_data.Resolve(mkfData.IDS.FAMILY));
    }

}

module.exports = PangramFooter;
ui.Register(`mkf-pangram-footer`, PangramFooter);