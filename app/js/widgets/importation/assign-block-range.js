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

class AssignSelectionBlockRangeControl extends AssignBaseControl {
    constructor() { super(); }

    static __valueIDs = [];

    static __controls = [
        { cl: ControlHeader, options: { label: `Block infos` } },
        { options: { propertyId: mkfData.IDS_EXT.IMPORT_BLOCK } },
        { options: { propertyId: mkfData.IDS_EXT.IMPORT_BLOCK_START } },
    ];

    _Init() {
        super._Init();
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {

            },
        }, super._Style());
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
            this._start = mkfData.UTILS.FindFirstEmptyIndex(this.editor._subFamily.family, this._start);
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
ui.Register(`mkfont-assign-block-range`, AssignSelectionBlockRangeControl);