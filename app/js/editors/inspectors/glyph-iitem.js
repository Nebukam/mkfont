'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const operations = require(`../../operations/index`);

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

class GlyphVariantInspectorItem extends nkm.ui.Widget {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._svgPaste = operations.commands.ClipboardReadSVG;
        this._ctrls = [];
        this._idList = [
            mkfData.IDS.ID,
            mkfData.IDS.H_ADV_X,
            mkfData.IDS.V_ADV_Y
        ];
    }

    get editor() { return nkm.datacontrols.FindEditor(this); }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'flex',
                'flex-flow': 'column nowrap'
            },
            '.preview': {
                'position': 'relative',
                'aspect-ratio': 'var(--preview-ratio)',
                'flex': '0 0 auto',
                'overflow': 'hidden',
                'padding': '10px',
                'background-color': 'rgba(0,0,0,0.5)',
                'border-radius': '5px',
                'margin-bottom':'10px'
            },
            '.renderer': {
                'position': 'relative',
                'width': '100%',
                'aspect-ratio': 'var(--preview-ratio)'
            },
            '.control': {
                'flex': '1 1 auto',
                'margin-bottom': '5px'
            }
        }, super._Style());
    }

    _Render() {
        super._Render();
        this._previewBox = ui.dom.El(`div`, { class: `preview` }, this._host);
        this._svgRenderer = this.Add(mkfWidgets.GlyphRenderer, `renderer`, this._previewBox);

        for (let i = 0; i < this._idList.length; i++) {
            let ctrl = this.Add(mkfWidgets.PropertyControl, `control`);
            ctrl.Setup(this._idList[i]);
            this._ctrls.push(ctrl);
        }

    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        if (!this._data) { return; }
        let subFamily = this._data.subFamily;
        for (let i = 0; i < this._ctrls.length; i++) {
            this._ctrls[i].Set(this._data, subFamily);
        }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._svgRenderer.Set(p_data);
    }

}

module.exports = GlyphVariantInspectorItem;