'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;

const mkfData = require(`../../data`);
const mkfOperations = require(`../../operations`);
const mkfCmds = mkfOperations.commands;

const AssignBaseControl = require("./assign-base");
const ControlHeader = require(`../control-header`);

class AssignSelectionRangeControl extends AssignBaseControl {
    constructor() { super(); }

    static __valueIDs = [];

    static __controls = [
        //{ cl: ControlHeader, options: { label: `Selection infos` } },
        //{ options: { propertyId: mkfData.IDS_EXT.EXPORT_GLYPH } },
        //{ options: { propertyId: mkfData.IDS_EXT.GLYPH_NAME } },
    ];

    _Init() {
        super._Init();
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {

            },
            '.label': {
                'text-align': 'center',
                'padding':`15px`
            }
        }, super._Style());
    }

    _Render() {
        super._Render();
        this._label = new ui.manipulators.Text(ui.El(`div`, { class: `label` }, this._host));
    }

    _UpdateList() {
        // preprocess required values...
        this._block = this.editor._importSelection.stack._array;
        this._start = 0;
        this._count = this._block.length;
        this._end = this._start + this._count;

        let
            len = this._importList.length,
            text = `${this._count} selected glyphs.`;

        if (len > this._count) {
            if(this._count == 0){
                text += `<br><span style='color:var(--col-warning)'>No item can be automatically assigned.</span>`;
            }else{
                text += `<br><span style='color:var(--col-warning)'>Only the first ${this._count} items can be automatically assigned.</span>`;
            }
            
        }
        this._label.Set(text);

        super._UpdateList();
    }

    _ComputeStartOffset() {
        //this._offsetIndex = 0;
    }

    _InternalProcess(p_item, p_index) {
        if (p_index >= this._end || p_index < 0) {
            p_item.outOfRange = true;
            p_item.targetUnicode = [];
        } else {
            let unicode = this._block[p_index].u;
            p_item.targetUnicode = [unicode];
            p_item.placeholder = unicode;
        }
    }

}

module.exports = AssignSelectionRangeControl;
ui.Register(`mkfont-assign-selection-range`, AssignSelectionRangeControl);