'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfCatalog = require(`../../catalogs`);

// Manages what is shown & selectable in the viewport.

const base = nkm.datacontrols.InspectorView;
class FamilyActionsInspector extends base {
    constructor() { super(); }

    _Init() {
        super._Init();
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'flex',
                'flex-flow': 'column nowrap',
            },
            '.body': {
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'flex': '1 1 auto',
                'min-height': '0',
                'overflow': 'auto',
                'padding': '10px',
                'justify-content': 'flex-start'
            },
            '.item': {
                'flex': '0 0 auto',
                'margin-bottom': '5px'
            }
        }, base._Style());
    }

    _Render() {
        super._Render();
        // Categories
        // Blocks
        // - blocks need to be searchable, there is too much of them.
        this._header = this.Attach(mkfWidgets.InspectorHeader, `header`, this._host);
        this._header.options = { title: `Actions`, icon: `action` };


    }

}

module.exports = FamilyActionsInspector;
ui.Register(`mkf-family-actions-inspector`, FamilyActionsInspector);