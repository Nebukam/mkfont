const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

// Manages what is shown & selectable in the viewport.

class FamilyContentInspector extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    _Init() {
        super._Init();
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
        super._Render();
        // Categories
        // Blocks
        // - blocks need to be searchable, there is too much of them.
        this._body = ui.dom.El(`div`, {class:`body`});
        this._categories = this.Add(mkfWidgets.lists.FilterRoot);
        this._blocks = this.Add(mkfWidgets.lists.);
    }

    //#region Family properties

    _PreprocessData(p_data) {
        if (!nkm.utils.isInstanceOf(p_data, mkfData.Family)) { return null; }
        return p_data;
    }

    //#endregion

}

module.exports = FamilyContentInspector;
ui.Register(`mkf-family-content-inspector`, FamilyContentInspector);