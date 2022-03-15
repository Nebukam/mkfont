// Read svg from clipboard and trigger "action-set-svg"
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const { clipboard } = require('electron');

const ActionSetPathData = require(`../actions/action-set-path-data`);

class CmdClipboardReadSVG extends actions.CommandAction {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._actionClass = ActionSetPathData;
        this._shortcut = actions.Keystroke.CreateFromString("Ctrl V");
        this.Disable();
    }

    _FetchContext() {

        let
            slot = this._emitter.data,
            family = this._emitter.context;

        if (!slot || !family) { return null; }

        console.log(clipboard.readText());

        let svgStats = SVGOPS.SVGStats(clipboard.readText());

        if (!svgStats) { return null; }

        return {
            family: family,
            slot: slot,
            svg: svgStats
        };

    }

}

module.exports = CmdClipboardReadSVG;
