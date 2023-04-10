'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;

const mkfData = require(`../../data`);
const mkfOperations = require(`../../operations`);
const mkfCmds = mkfOperations.commands;

const AssignBaseControl = require("./assign-base");

const base = AssignBaseControl;
class AssignSelectionRangeControl extends base {
    constructor() { super(); }

    static __valueIDs = [];

    static __controls = [
        //{ cl: MiniHeader, options: { label: `Selection infos` } },
    ];

    _Init() {
        super._Init();
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {

            },
            '.label': {
                'text-align': 'center',
                'padding': `15px`
            }
        }, base._Style());
    }

    _Render() {
        super._Render();
        this._label = new ui.manipulators.Text(ui.El(`div`, { class: `label` }, this._host));
    }

    _UpdateList() {
        // preprocess required values...
        this._block = this.editor._importSelection ? this.editor._importSelection.stack._array : [];
        this._start = 0;
        this._count = this._block.length;
        this._end = this._start + this._count;

        let
            len = this._importList.length,
            text = `${this._count} selected glyphs.`;

        if (len > this._count) {
            if (this._count == 0) {
                text += `<br><span style='color:var(--col-warning)'>No item can be automatically assigned.</span>`;
            } else {
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
ui.Register(`mkf-assign-selection-range`, AssignSelectionRangeControl);