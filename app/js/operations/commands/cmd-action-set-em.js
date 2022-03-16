// Read svg from clipboard and trigger "action-set-svg"
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const IDS = require(`../../data/ids`);

const CmdActionProperty = require(`./cmd-action-set-property`);
const SetEM = require(`../actions/action-set-em`);

class CmdActionSetEM extends CmdActionProperty {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._actionClass = SetEM;
    }

    _FetchContext() {

        let operation = super._FetchContext();
        operation.resample = this._emitter.data.Get(IDS.EM_RESAMPLE);
        return operation;

    }

}

module.exports = CmdActionSetEM;
