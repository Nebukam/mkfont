//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const fs = require('fs');

const mkfData = require(`../../data`);

const CmdStartNewMKFont = require(`./cmd-start-new-mkfont`);

class CmdStartNewMKFontFromTTF extends CmdStartNewMKFont {
    constructor() { super(); }

    static __defaultName = `New .mkfont from TTF`;
    static __defaultIcon = `directory-download-small`;

    _InternalExecute() {

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

        try { this._newFamily = mkfData.TTF.FamilyFromTTF(fs.readFileSync(p)); }
        catch (e) {
            this._Fail(e);
            return;
        }

        this._RequestEdit();

    }

}

module.exports = CmdStartNewMKFontFromTTF;