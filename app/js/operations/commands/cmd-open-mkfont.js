//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const mkfData = require(`../../data`);

class CmdOpenMKFont extends actions.Command {
    constructor() { super(); }

    static __defaultName = `Load .mkfont`;
    static __defaultIcon = `document-download-small`;

    _Init() {
        super._Init();
        this._newFamily = null;
    }

    _InternalExecute() {

        this._newFamily = nkm.com.Rent(mkfData.Family);
        this._RequestEdit();

    }

    _RequestEdit() {
        nkm.actions.Emit(
            nkm.actions.REQUEST.EDIT,
            { data: this._newFamily },
            this, this._Success, this._Fail);
    }

    _Cancel() {
        if (this._newFamily) { this._newFamily.Release(); }
        super._Cancel();
    }

    _Fail(p_msg) {
        if (this._newFamily) { this._newFamily.Release(); }
        super._Fail(p_msg);
    }

    _End() {
        this._newFamily = null;
        super._End();
    }

}

module.exports = CmdOpenMKFont;