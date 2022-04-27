//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfCatalog = require(`../../catalogs`);
const mkfActions = require(`../actions`);

class CmdImportMKFont extends actions.Command {
    constructor() { super(); }

    _Init() {

        super._Init();

        this._Bind(this._OnPicked);
        this._Bind(this._OnImportContinue);

        this._importList = [];
        this._importEditor = null;

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
                filters: [{ name: 'MKFont file', extensions: ['mkfont'] }],
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
            filepath = p_response.filePaths[0],
            list,
            svgStats;

        try {
            list = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            list = list.data.glyphs;
        }
        catch (e) { mkfont = null; console.error(e); }

        //console.log(list);

        let family = this._context;
        this._importList.length = 0;

        for (let i = 0; i < list.length; i++) {
            this._importList.push(list[i]);
        }

        if (this._importList.length == 0) {
            this._Cancel();
            return;
        }

        if (!this._importEditor) { this._importEditor = nkm.ui.UI.Rent(`mkf-mkfont-import-editor`); }


        this._importEditor.family = family;
        this._importEditor.importList = this._importList;

        this._blockingDialog.Consume();
        this._blockingDialog = null;

        nkm.dialog.Push({
            title: `MKFont import`,
            //message: `Tweak the imported data to make sure it fits!`,
            content: [{ cl: this._importEditor, donotrelease: true }],
            actions: [
                { label: `Import selected`, icon: `load-arrow`, flavor: nkm.com.FLAGS.LOADING, trigger: { fn: this._OnImportContinue } },
                { label: `Cancel`, trigger: { fn: this._Cancel, thisArg: this } }
            ],
            icon: `directory-download`,
            grow: true,
            origin: this,
        });

    }

    _OnImportContinue() {

        //Go through the catalog

        let
            family = this._emitter.data,
            trValues = this._importTransformationSettings.Values();

        this._emitter.StartActionGroup({
            icon: `directory-download`,
            name: `Import SVGs`,
            title: `Imported SVGs as glyph`
        });

        for (let i = 0; i < this._importList.length; i++) {
            let
                item = this._importList[i],
                targetUnicode = item.values.unicode;

            if (!item.selected) {
                continue;
            }

            let unicodeInfos = UNICODE.GetInfos(targetUnicode, true);

            if (!unicodeInfos) { continue; }

            let existingGlyph = family.GetGlyph(unicodeInfos.u);

            if (existingGlyph.isNull) {

                // Create glyph

                this._emitter.Do(mkfActions.CreateGlyph, {
                    family: family,
                    unicode: unicodeInfos,
                    path: svgStats,
                    transforms: trValues
                });

            } else {

                // Overwrite glyph

                let variant = existingGlyph.activeVariant;
                this._emitter.Do(mkfActions.SetProperty, {
                    target: variant,
                    id: mkfData.IDS.PATH_DATA,
                    value: svgStats
                });

                if (overlapMode == mkfData.ENUMS.OVERLAP_OVERWRITE) {
                    this._emitter.Do(mkfActions.SetPropertyMultiple, {
                        target: variant.transformSettings,
                        values: trValues
                    });
                }

            }

        }

        this._emitter.EndActionGroup();

        this._Success();
    }

    _OnImportCancel() {
        this._Cancel();
    }

    _End() {
        if (this._blockingDialog) { this._blockingDialog.Consume(); }
        if (this._importEditor) {
            this._importEditor.data = null;
            this._importEditor._importList = null;
            this._importEditor.family = null;
        }
        super._End();
    }

}

module.exports = CmdImportMKFont;