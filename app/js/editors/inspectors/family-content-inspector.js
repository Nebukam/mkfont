/*const nkm = require(`@nkmjs/core`);*/
const ui = nkm.ui;
const uilib = nkm.uilib;

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

// Manages what is shown & selectable in the viewport.

class FamilyContentInspector extends nkm.datacontrols.InspectorView {
    constructor() { super(); }

    _Init() {
        super._Init();
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
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
        }, super._Style());
    }

    _Render() {
        super._Render();
        // Categories
        // Blocks
        // - blocks need to be searchable, there is too much of them.
        this._body = ui.dom.El(`div`, {class:`body`}, this);
        
        this._categories = this.Add(mkfWidgets.lists.FilterRoot, `asd`, this._body);
        this._categories.data = UNICODE.instance._categoriesCatalog;

        this._blocks = this.Add(mkfWidgets.lists.BlockRoot, `asd`, this._body);
        this._blocks.data = UNICODE.instance._blockCatalog;
    }

    //#region Family properties


    //#endregion

}

module.exports = FamilyContentInspector;
ui.Register(`mkf-family-content-inspector`, FamilyContentInspector);