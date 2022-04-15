//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

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

        this._blockingDialog = nkm.dialog.Push({
            title: `Processing`,
            message: `Please wait...`,
            icon: `load-arrow-small`,
            origin: this,
        });

        if (nkm.env.isNodeEnabled) {
            nkm.actions.RELAY.ShowOpenDialog({
                //defaultPath: this._currentValue ? this._currentValue : ``,
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
            family = this._emitter.data;

        this._emitter.StartActionGroup({
            icon: `document-download`,
            name: `TTF Import`,
            title: `Created glyphs from TTF file`
        });

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
                this._emitter.Do(mkfActions.CreateGlyph, {
                    family: family,
                    unicode: unicodeInfos,
                    path: svgStats,
                    transforms: transforms
                });
            } else {
                let variant = existingGlyph.GetVariant(family.selectedSubFamily);
                this._emitter.Do(mkfActions.SetProperty, {
                    target: variant,
                    id: mkfData.IDS.PATH_DATA,
                    value: svgStats
                });
                this._emitter.Do(mkfActions.SetPropertyMultiple, {
                    target: variant.transformSettings,
                    values: transforms
                });
            }

        }

        this._emitter.EndActionGroup();

        this._Success();

    }

    _OnImportCancel() {
        this._Cancel();
    }

    _End() {
        this._blockingDialog.Consume();
        super._End();
    }

}

module.exports = CmdImportTTF;