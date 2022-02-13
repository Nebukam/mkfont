// Read svg from clipboard and trigger "action-set-svg"
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const { clipboard } = require('electron');

const ActionSetSVG = require(`../actions/action-set-svg`);

class CmdClipboardReadSVG extends actions.CommandAction {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._actionClass = ActionSetSVG;
        this._shortcut = actions.Keystroke.CreateFromString("Ctrl V");
    }

    _FetchContext(){

        // Read clipboard content
        var text = clipboard.readText();
        console.log(text);

        return text;

    }

}

module.exports = CmdClipboardReadSVG;
