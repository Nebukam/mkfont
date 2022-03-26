//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.utils;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdImportTTF extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._Bind(this._OnPicked);
    }

    _InternalExecute() {

        // - File picker
        // - DIALOG popup management
        // - If dialog confirms import, then move on to next step
        // - If dialog is cancelled, then fail this command.

        if (nkm.env.isNodeEnabled) {
            nkm.actions.RELAY.ShowOpenDialog({
                //defaultPath: this._currentValue ? this._currentValue : ``,
                filters:[{ name:'TrueType files', extensions:['ttf'] } ],
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
            importedGlyphs = null,
            subFamily = this._context.selectedSubFamily;

        try { importedGlyphs = mkfData.TTF.GetImportData(subFamily, fs.readFileSync(p)); }
        catch (e) { console.error(e); }

        if (!importedGlyphs) {
            nkm.dialog.Push({
                title: `Invalid content`,
                message: `Couldn't find how to use the selected file :(`,
                actions: [{ label: `Okay` }],
                origin: this, flavor: nkm.com.FLAGS.WARNING
            });
            this._Cancel();
            return;
        }


        let
            editor = this._emitter.editor,
            family = editor.data;

        editor.StartActionGroup({ title:`TTF Import` });

        for (let i = 0; i < importedGlyphs.length; i++) {
            let
                item = importedGlyphs[i],
                unicode = item[mkfData.IDS.UNICODE],
                glyphName = item[mkfData.IDS.GLYPH_NAME],
                svgStats = item[mkfData.IDS.PATH_DATA],
                transforms = item.transforms;

            let
                unicodeInfos = UNICODE.GetSingle(unicode),
                existingGlyph = family.GetGlyph(unicodeInfos.u);

            if (existingGlyph.isNull) {
                editor.Do(mkfActions.CreateGlyph, {
                    family: family,
                    unicode: unicodeInfos,
                    path: svgStats,
                    transforms: transforms
                });
            } else {
                let variant = existingGlyph.GetVariant(family.selectedSubFamily);
                editor.Do(mkfActions.SetProperty, {
                    target: variant,
                    id: mkfData.IDS.PATH_DATA,
                    value: svgStats
                });
                editor.Do(mkfActions.SetPropertyMultiple, {
                    target: variant.transformSettings,
                    values: transforms
                });
            }

        }

        editor.EndActionGroup();


        this._Success();

    }

    _OnImportContinue() {

    }

    _OnImportCancel() {
        this._Cancel();
    }

}

module.exports = CmdImportTTF;