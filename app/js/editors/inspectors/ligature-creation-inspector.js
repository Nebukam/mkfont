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
                //...nkm.style.flexItem.fixed,
            },
            '.list': {
                ...nkm.style.flex.column,
                ...nkm.style.flexItem.fill,
                'overflow': 'auto',
                'padding': '10px',
            },
            '.control': {
                ...nkm.style.flexItem.shrink,
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