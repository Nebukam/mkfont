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

const base = AssignBaseControl;
class AssignSelectionControl extends base {
    constructor() { super(); }

    static __valueIDs = [];

    static __controls = [
        { cl: ControlHeader, options: { label: `Selection infos` } },
    ];

    _Init() {
        super._Init();
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {

            },
        }, base._Style());
    }

    _Render() {
        super._Render();

    }

    _UpdateList() {
        // preprocess required values...
        this._block = this.editor._importSelection.stack._array;
        this._start = 0;
        this._count = this._block.length;
        this._end = this._start + this._count;
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

module.exports = AssignSelectionControl;
ui.Register(`mkfont-assign-selection`, AssignSelectionControl);