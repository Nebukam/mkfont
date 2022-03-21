//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;


class CmdSetDisplayList extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
    }

    _InternalExecute() {

        let editor = nkm.datacontrols.FindEditor(this._context);
        if(editor){ editor.SetActiveRange(this._context.data); }

        this._Success();

    }

}

module.exports = CmdSetDisplayList;