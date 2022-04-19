// Read svg from clipboard and trigger "action-set-svg"
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const { clipboard } = require('electron');

const SetPropertyOverride = require(`../actions/action-set-property-override`);

class CmdActionPropertyOverride extends actions.CommandAction {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._inputValue = null;
        this._actionClass = SetPropertyOverride; // Action
    }

    set inputValue(p_value) { this._inputValue = p_value; }
    get inputValue() { return this._inputValue; }

    _FetchContext() {
        return {
            id: this._emitter.propertyId,
            target: this._emitter.data,
            value: this._inputValue
        };
    }

}

module.exports = CmdActionPropertyOverride;
