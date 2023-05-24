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
        { cl: nkm.datacontrols.widgets.MiniHeader, options: { label: `Display options` } },
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
        this._builder.defaultControlClass = nkm.datacontrols.widgets.ValueControl;
        this._builder.defaultCSS = `control`;
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                'min-width': '350px',
                //...nkm.style.rules.item.fixed,
            },
            '.list': {
                ...nkm.style.rules.flex.column.nowrap,
                ...nkm.style.rules.item.fill,
                'overflow': 'auto',
                'padding': '10px',
            },
            '.control': {
                ...nkm.style.rules.item.shrink,
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