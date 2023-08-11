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
class AssignSelectionBlockControl extends base {
    constructor() { super(); }

    static __valueIDs = [
        mkfData.IDS_EXT.IMPORT_BLOCK,
        mkfData.IDS_EXT.IMPORT_BLOCK_START
    ];

    static __controls = [
        { cl: nkm.datacontrols.widgets.MiniHeader, options: { label: `Block infos` } },
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

        if (this._data.Get(mkfData.IDS_EXT.IMPORT_BLOCK_START) == mkfData.ENUMS.BLOCK_START_FIRST_AVAIL) {
            this._start = mkfData.UTILS.FindFirstEmptyIndex(this.editor.family, this._start);
        }

        super._UpdateList();
    }

    _ComputeStartOffset() {
        //this._offsetIndex = 0;
    }

    _InternalProcess(p_item, p_index) {
        // Update item data
        p_index += this._start;
        let unicode = p_index.toString(16).padStart(4, '0');
        p_item.targetUnicode = [unicode];
        p_item.placeholder = unicode;
    }

}

module.exports = AssignSelectionBlockControl;
ui.Register(`mkf-assign-block`, AssignSelectionBlockControl);