'use strict';

// Read svg from clipboard and trigger "action-set-svg"
const nkm = require(`@nkmjs/core`);
const SetLayerControl = require(`../actions/action-set-layer-control`);

class CmdActionSetControl extends nkm.data.ops.commands.CmdActionSetProperty {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._actionClass = SetLayerControl;
    }

}

module.exports = CmdActionSetControl;
