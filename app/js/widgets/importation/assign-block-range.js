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
        // preprocess required values...
        super._UpdateList();
    }

    _InternalProcess(p_item) {
        // Update item data
    }

}

module.exports = AssignSelectionBlockRangeControl;
ui.Register(`mkfont-assign-block-range`, AssignSelectionBlockRangeControl);