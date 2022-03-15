//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.utils;

const { clipboard } = require('electron');
const fs = require('fs');

const mkfData = require(`../../data`);
const mkfViews = require(`../../views`);

const ActionSetPathData = require(`../actions/action-set-path-data`);

class CmdImportExternalFileMultiple extends actions.Command {
    constructor() { super(); }

    _Init() {

        super._Init();

        this._Bind(this._OnPicked);
        this._Bind(this._OnImportContinue);

        this._importCatalog = nkm.data.catalogs.CreateFrom({ name: `Import list` });
        this._importCatalog.expanded = true;

        this._importInspector = null;
        this._importTransformationSettings = new mkfData.TransformSettings();

    }

    set glyphInfos(p_value) { this._glyphInfos = p_value; }
    get glyphInfos() { return this._glyphInfos; }

    _InternalExecute() {

        console.log(`CmdImportExternalFileMultiple -> `, this._context);

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

        let list = p_response.filePaths;

        if (list.length == 0) {
            this._Cancel();
            return;
        }

        for (let i = 0; i < list.length; i++) {

            let filePath = nkm.utils.PATH.Sanitize(list[i]);

            try {

                let
                    svgString = fs.readFileSync(filePath, 'utf8'),
                    svgStats = SVGOPS.SVGStats(svgString);

                if (!svgStats.exists) { continue; }

                let entryOptions = {
                    filePath: filePath,
                    name: nkm.utils.PATH.name(filePath),
                    svgStats: svgStats
                };

                console.log(entryOptions);

                this._importCatalog.Register(entryOptions);

            }
            catch (e) { console.log(e); }
        }

        if (this._importCatalog.count == 0) {
            this._Cancel();
            return;
        }

        //this._importInspector.data = ;

        if (!this._importInspector) {
            this._importInspector = nkm.ui.UI.Rent(`mkfont-multiple-import-preview`);
        }

        //this._importTransformationSettings

        this._importInspector.subFamily = this._context.selectedSubFamily;
        this._importInspector.data = this._importTransformationSettings;
        this._importInspector.catalog = this._importCatalog;

        nkm.dialog.Push({
            title: `List import`,
            //message: `Tweak the imported data to make sure it fits!`,
            content: [{ cl: this._importInspector, donotrelease: true }],
            actions: [
                { label: `Looks good`, flavor: nkm.ui.FLAGS.CTA, trigger: { fn: this._OnImportContinue } }, //variant: nkm.ui.FLAGS.FRAME
                { label: `Cancel`, trigger: { fn: this._Cancel, thisArg: this } }
            ],
            grow: true,
            origin: this,
        });

    }

    _OnImportContinue() {
        this._Success();
    }

    _OnImportCancel() {
        this._Cancel();
    }

    _End() {
        this._importCatalog.Clear();
        super._End();
    }

}

module.exports = CmdImportExternalFileMultiple;