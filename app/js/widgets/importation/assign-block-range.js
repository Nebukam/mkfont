'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;

const MiniHeader = nkm.datacontrols.widgets.MiniHeader;
const ValueControl = nkm.datacontrols.widgets.ValueControl;

const mkfData = require(`../../data`);
const mkfOperations = require(`../../operations`);
const mkfCmds = mkfOperations.commands;

const AssignBaseControl = require("./assign-base");

const base = AssignBaseControl;
class AssignSelectionBlockRangeControl extends base {
    constructor() { super(); }

    static __valueIDs = [];

    static __controls = [
        { cl: MiniHeader, options: { label: `Block infos` } },
        { options: { propertyId: mkfData.IDS_EXT.IMPORT_BLOCK } },
        { options: { propertyId: mkfData.IDS_EXT.IMPORT_BLOCK_START } },
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
        this._block = this._data.Get(mkfData.IDS_EXT.IMPORT_BLOCK);
        this._start = this._block._options.start;
        this._count = this._block._options.count;
        this._end = this._start + this._count;

        if (this._data.Get(mkfData.IDS_EXT.IMPORT_BLOCK_START) == mkfData.ENUMS.BLOCK_START_FIRST_AVAIL) {
            this._start = mkfData.UTILS.FindFirstEmptyIndex(this.editor.family, this._start);
            this._count = Math.max(this._end - this._start, 0);
            this._end = this._start + (this._end - this._start);
        }

        super._UpdateList();
    }

    _ComputeStartOffset() {
        //this._offsetIndex = 0;
    }

    _InternalProcess(p_item, p_index) {
        p_index += this._start;
        let unicode = p_index.toString(16).padStart(4, '0');
        p_item.targetUnicode = [unicode];
        p_item.placeholder = unicode;
        if (p_index > this._end) { p_item.outOfRange = true; }
    }

}

module.exports = AssignSelectionBlockRangeControl;
ui.Register(`mkf-assign-block-range`, AssignSelectionBlockRangeControl);