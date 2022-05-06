'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const fs = require('fs');

const mkfData = require(`../../data`);

const CmdCreateFamilyDoc = require(`./cmd-start-new-mkfont`);

class CmdCreateFamilyDocFromTTF extends CmdCreateFamilyDoc {
    constructor() { super(); }

    static __displayName = `Load TTF`;
    static __displayIcon = `document-upload-small`;

    _Init() {
        super._Init();
        this._Bind(this._OnPicked);
    }

    _InternalExecute() {

        this._blockingDialog = nkm.dialog.Push({
            title: `Processing`,
            message: `Please wait...`,
            icon: `load-arrow`,
            origin: this,
        });

        if (nkm.env.isNodeEnabled) {
            nkm.actions.RELAY.ShowOpenDialog({
                filters: [{ name: 'TrueType files', extensions: ['ttf'] }],
                properties: ['openFile']
            }, this._OnPicked);
        } else {
            this._Cancel();
        }

    }

    _OnPicked(p_response) {

        if (p_response.canceled) {
            this._Cancel();
            return;
        }

        let p = p_response.filePaths[0];;

        try {
            this._newFamily = mkfData.TTF.FamilyFromTTF(fs.readFileSync(p));
            let document = this._GetDoc(true),
                deprecatedData = document.currentData;

            document.currentData = this._newFamily;
            deprecatedData.Release();

        }
        catch (e) {
            this._Fail(e);
            return;
        }

        this._RequestEdit();

    }

    _End() {
        this._blockingDialog.Consume();
        super._End();
    }

}

module.exports = CmdCreateFamilyDocFromTTF;