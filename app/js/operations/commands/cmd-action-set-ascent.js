// Read svg from clipboard and trigger "action-set-svg"
/*const nkm = require(`@nkmjs/core`);*/
const actions = nkm.actions;

const CmdActionProperty = require(`./cmd-action-property`);
const ActionSetAscent = require(`../actions/action-set-ascent`);

class CmdActionSetAscent extends CmdActionProperty {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._actionClass = ActionSetAscent;
    }

    _FetchContext() {

        let
            subFamily = this._emitter.data,
            ascent = this._inputValue;

        if (!subFamily || !ascent) { return null; }

        return {
            subFamily: subFamily,
            ascent: ascent
        };

    }

}

module.exports = CmdActionSetAscent;
