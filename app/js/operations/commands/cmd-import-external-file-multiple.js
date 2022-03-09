//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const { clipboard } = require('electron');
const fs = require('fs');

const mkfData = require(`../../data`);

const ActionSetSVG = require(`../actions/action-set-svg`);
const SVG = require(`../svg-operations`);

class CmdImportExternalFileMultiple extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._Bind(this._OnPicked);
        this._glyphInfos = null;
    }

    set glyphInfos(p_value) { this._glyphInfos = p_value; }
    get glyphInfos() { return this._glyphInfos; }

    _InternalExecute() {

        console.log(`CmdImportExternalFile -> `, this._context);

        // - File picker
        // - DIALOG popup management
        // - If dialog confirms import, then move on to next step
        // - If dialog is cancelled, then fail this command.

        if (nkm.env.isNodeEnabled) {
            nkm.actions.RELAY.ShowOpenDialog({
                //defaultPath: this._currentValue ? this._currentValue : ``,
                properties: ['openFile', 'multiSelections']
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

        for (let i = 0; i < p_response.filePaths.length; i++) {

            let
                p = p_response.filePaths[i],
                svgString,
                svgStats;

            try { svgString = fs.readFileSync(p, 'utf8'); }
            catch (e) { svgString = null; }

            svgStats = SVG.SVGStats(svgString);
            svgStats.path = p;
            svgStats.name = nkm.utils.PATH.name(p);

            console.log(p, svgStats);
        }

        this._Success();
    }

    _OnImportContinue() {

    }

    _OnImportCancel() {
        this._Cancel();
    }

}

module.exports = CmdImportExternalFileMultiple;