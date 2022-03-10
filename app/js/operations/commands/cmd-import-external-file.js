//
/*const nkm = require(`@nkmjs/core`);*/
const actions = nkm.actions;
const u = nkm.utils;

const { clipboard } = require('electron');
const fs = require('fs');

const mkfData = require(`../../data`);

const ActionSetSVG = require(`../actions/action-set-svg`);
const SVG = require(`../svg-operations`);

class CmdImportExternalFile extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._Bind(this._OnPicked);
        this._glyphInfos = null;
        this._importInspector = null;
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

        svgStats = SVG.SVGStats(svgString);
        svgStats.filepath = p;
        svgStats.name = nkm.utils.PATH.name(p);

        if (!svgStats.exists) {
            nkm.dialog.Push({
                title: `Invalid content`,
                message: `Couldn't find how to use the selected file :()`,
                actions: [{ label: `Okay` }],
                origin: this, flavor: nkm.com.FLAGS.WARNING
            });
        } else {

            if (!this._importInspector) {
                this._importInspector = nkm.ui.UI.Rent(`mkfont-single-import-preview`);
            }

            let glyphInfos = null;
            let subFamily = this._emitter.editor.data.selectedSubFamily;;

            if(u.isInstanceOf(this._context, mkfData.Glyph)){
                glyphInfos = this._context.unicodeInfos;
            }else if(u.isInstanceOf(this._context, mkfData.GlyphVariant)){
                glyphInfos = this._context.glyph.unicodeInfos;
            }else{
                throw new Error(`Context is not a glyph`);
            }
            
            //this._importInspector.data = ;
            
            this._importInspector.glyphInfos = glyphInfos;
            this._importInspector.importedGlyph = svgStats;
            this._importInspector.subFamily = subFamily;
            this._importInspector.data = subFamily.family.importSettings;

            nkm.dialog.Push({
                title: `Tweaks`,
                //message: `Tweak the imported data to make sure it fits!`,
                content: [{ cl: this._importInspector, donotrelease: true }],
                actions: [
                    { label: `Looks good`, flavor: nkm.com.FLAGS.READY, variant: nkm.ui.FLAGS.FRAME },
                    { label: `Cancel`, trigger: { fn: this._Cancel, thisArg: this } }
                ],
                grow:true,
                origin: this,
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