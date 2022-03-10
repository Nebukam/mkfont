// Read svg from clipboard and trigger "action-set-svg"
/*const nkm = require(`@nkmjs/core`);*/
const actions = nkm.actions;

const { clipboard } = require('electron');

const ActionSetAscent = require(`../actions/action-set-ascent`);

class CmdActionProperty extends actions.CommandAction {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._inputValue = null;
        this._actionClass = null; // Action
    }

    set inputValue(p_value){ this._inputValue = p_value; }
    get inputValue(){ return this._inputValue; }

    _FetchContext() {
        
    }

}

module.exports = CmdActionProperty;
