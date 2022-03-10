// Read svg from clipboard and trigger "action-set-svg"
/*const nkm = require(`@nkmjs/core`);*/
const actions = nkm.actions;
const IDS = require(`../../data/ids`);

const CmdActionProperty = require(`./cmd-action-property`);
const ActionSetEMUnits = require(`../actions/action-set-em-units`);

class CmdActionSetEMUnits extends CmdActionProperty {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._actionClass = ActionSetEMUnits;
    }

    _FetchContext() {

        let
            subFamily = this._emitter.data,
            em = this._inputValue;

        if (!subFamily || !em) { return null; }

        return {
            subFamily: subFamily,
            resample: subFamily.Get(IDS.EM_RESAMPLE),
            em: em
        };

    }

}

module.exports = CmdActionSetEMUnits;
