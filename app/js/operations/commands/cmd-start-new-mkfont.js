//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const mkfData = require(`../../data`);
const mkfDocuments = require(`../../documents`);

class CmdCreateFamilyDoc extends nkm.documents.commands.DocumentCreate { //actions.Command
    constructor() { super(); }

    static __defaultName = `New .mkfont`;
    static __defaultIcon = `new`;

    static __docType = mkfDocuments.Family;
    static __dataType = mkfData.Family;
    static __fileInfos = { name: 'MKFont files', extensions: ['mkfont'] };

    /*
    _Init() {
        super._Init();
        this._newFamily = null;
    }

    _InternalExecute() {

        let document = nkm.documents.DOCUMENTS.Get({
            data:mkfData.Family,
            document:mkfDocuments.Family
        });

        console.log(document);

        this._newFamily = document.currentData;
        this._newFamily.CommitUpdate();
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
    */

}

module.exports = CmdCreateFamilyDoc;