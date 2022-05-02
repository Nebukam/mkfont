'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

const base = nkm.datacontrols.InspectorView;
class LigatureCreationInspector extends base {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._ligaCatalog = nkm.data.catalogs.CreateFrom({ name:`ligatures` });
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

        super._Render();

        this._inputs = ui.dom.El(`div`, { class: `inputs` }, this._host);
        this._textInput = this.Attach(nkm.uilib.inputs.Textarea, `textarea`, this._inputs)

        this._list = this.Attach(mkfWidgets.lists.ImportLigaRoot);


    }



    //#region Family properties

    //#endregion


}

module.exports = LigatureCreationInspector;
ui.Register(`mkf-ligature-inspector`, LigatureCreationInspector);