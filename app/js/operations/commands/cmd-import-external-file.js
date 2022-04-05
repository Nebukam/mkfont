//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdImportExternalFile extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._Bind(this._OnPicked);
        this._glyphInfos = null;
    }

    set glyphInfos(p_value) { this._glyphInfos = p_value; }
    get glyphInfos() { return this._glyphInfos; }

    _InternalExecute() {

        // - File picker
        // - DIALOG popup management
        // - If dialog confirms import, then move on to next step
        // - If dialog is cancelled, then fail this command.

        if (nkm.env.isNodeEnabled) {
            nkm.actions.RELAY.ShowOpenDialog({
                //defaultPath: this._currentValue ? this._currentValue : ``,
                filters:[{ name:'SVG files', extensions:['svg'] } ],
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

        let
            p = p_response.filePaths[0],
            svgString,
            svgStats;

        try { svgString = fs.readFileSync(p, 'utf8'); }
        catch (e) { svgString = null; }

        svgStats = SVGOPS.SVGStats(svgString);
        svgStats.filepath = p;
        svgStats.name = nkm.u.PATH.name(p);

        if (!svgStats.exists) {
            nkm.dialog.Push({
                title: `Invalid content`,
                message: `Couldn't find how to use the selected file :()`,
                actions: [{ label: `Okay` }],
                origin: this, flavor: nkm.com.FLAGS.WARNING
            });
            this._Cancel();
            return;
        }


        let
            editor = this._emitter.editor,
            family = editor.data,
            subFamily = family.selectedSubFamily;

        // Check if glyph exists
        let
            variant = this._context,
            glyph = variant.glyph,
            unicodeInfos;

        if (glyph.isNull) {
            // Need to create a new glyph!
            unicodeInfos = glyph.unicodeInfos;
            editor.Do(mkfActions.CreateGlyph, {
                family: family,
                unicode: unicodeInfos,
                path: svgStats
            });
        } else {
            editor.Do(mkfActions.SetProperty, {
                target: variant,
                id: mkfData.IDS.PATH_DATA,
                value: svgStats
            });
        }

        this._Success();

    }

    _OnImportContinue() {

    }

    _OnImportCancel() {
        this._Cancel();
    }

}

module.exports = CmdImportExternalFile;