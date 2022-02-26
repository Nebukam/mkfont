// Read svg from clipboard and trigger "action-set-svg"
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const { clipboard } = require('electron');

const ActionSetSVG = require(`../actions/action-set-svg`);
const SVG = require(`../svg-operations`);

class CmdClipboardReadSVG extends actions.CommandAction {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._actionClass = ActionSetSVG;
        this._shortcut = actions.Keystroke.CreateFromString("Ctrl V");
        this.Disable();
    }

    _FetchContext() {

        let
            slot = this._emitter.data,
            family = this._emitter.context;

        if (!slot || !family) { return null; }

        console.log(clipboard.readText());

        let svgString = SVG.ProcessString(clipboard.readText());

        if (!svgString) { return null; }

        return {
            family: family,
            slot: slot,
            svg: svgString
        };

    }

}

module.exports = CmdClipboardReadSVG;
