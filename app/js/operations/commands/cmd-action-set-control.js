'use strict';

// Read svg from clipboard and trigger "action-set-svg"
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const IDS = require(`../../data/ids`);

const CmdActionProperty = require(`./cmd-action-set-property`);
const SetLayerControl = require(`../actions/action-set-layer-control`);

class CmdActionSetControl extends CmdActionProperty {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._actionClass = SetLayerControl;
    }

}

module.exports = CmdActionSetControl;
