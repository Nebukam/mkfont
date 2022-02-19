'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const operations = require(`../../operations/index`);

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfOperations = require(`../../operations`);

const GlyphVariantInspector = require(`./glyph-iitem`);

class GlyphInspector extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._svgPaste = operations.commands.ClipboardReadSVG;

        this._subFamilyCtrls = [];
        this._subFamilyidList = [
            { id: mkfData.IDS.ID },
            { id: mkfData.IDS.EM_UNITS },
            //{ id: mkfData.IDS.H_ADV_X },
            //{ id: mkfData.IDS.V_ADV_Y },
            { id: mkfData.IDS.ASCENT, fn: this._Bind(this._SetAscent) },
            { id: mkfData.IDS.DESCENT },
            { id: mkfData.IDS.CAP_HEIGHT },
            { id: mkfData.IDS.X_HEIGHT },
        ];

        this._dataObserver
            .Hook(mkfData.SIGNAL.SUBFAMILY_CHANGED, this._OnSubFamilyChanged, this);

        this._subFamily = null;

    }

    _Style() {
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
            },
            '.control': {
                'flex': '0 1 auto',
                'margin-bottom': '5px'
            }
        }, super._Style());
    }

    _Render() {
        super._Render();

        this._body = ui.dom.El(`div`, { class: `body` }, this._host);

        let ctrl;

        for (let i = 0; i < this._subFamilyidList.length; i++) {
            ctrl = this.Add(mkfWidgets.PropertyControl, `control`, this._body);
            let infos = this._subFamilyidList[i];
            ctrl.Setup(infos.id);
            ctrl._onSubmitFn = infos.fn;
            this._subFamilyCtrls.push(ctrl);
        }

    }

    _PreprocessData(p_data) {
        if (!nkm.utils.isInstanceOf(p_data, mkfData.Family)) { return null; }
        return p_data;
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        if (this._data) {
            this._subFamily = this._data.selectedSubFamily;
            this._OnSubFamilyChanged(this._subFamily);
        }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
    }

    _OnSubFamilyChanged(p_selectedSubFamily) {
        this._subFamily = p_selectedSubFamily;

        if (!p_selectedSubFamily) { return; }

        let def = this._data.defaultSubFamily;
        for (let i = 0; i < this._subFamilyCtrls.length; i++) {
            this._subFamilyCtrls[i].Set(p_selectedSubFamily, def);
        }
    }


    _OnDisplayGain() {
        super._OnDisplayGain();
        this._svgPaste.emitter = this;
        this._svgPaste.Enable();
    }

    _OnDisplayLost() {
        super._OnDisplayLost();
        if (this._svgPaste.emitter == this) { this._svgPaste.Disable(); }
    }

    // Special actions

    _SetAscent(p_id, p_value) {
        this._Do(mkfOperations.actions.SetAscent, {
            subFamily: this._subFamily,
            ascent: p_value
        });
    }

}

module.exports = GlyphInspector;