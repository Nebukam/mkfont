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

class CmdImportFileList extends actions.Command {
    constructor() { super(); }

    _Init() {

        super._Init();

        this._Bind(this._OnPicked);
        this._Bind(this._OnImportContinue);

        this._importList = [];
        this._importEditor = null;
        this._importTransformationSettings = new mkfData.ImportSettings();

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
                //defaultPath: this._currentValue ? this._currentValue : ``,
                filters: [{ name: 'SVG files', extensions: ['svg'] }],
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

        let family = this._context;

        this._PreprocessFileList(list);
        this._importList.length = 0;


        for (let i = 0; i < list.length; i++) {

            let filePath = list[i];

            try {

                let
                    svgString = fs.readFileSync(filePath, 'utf8'),
                    svgStats = SVGOPS.SVGStats(svgString);

                if (!svgStats.exists) { continue; }


                let fname = nkm.u.PATH.name(filePath),
                    entryOptions = {
                        filePath: filePath,
                        name: fname,
                        targetUnicode: null,
                        unicodeInfos: null,
                        outOfRange: false,
                        userDoImport: true,
                        userDoCustom: false,
                        userInput: fname,
                        placeholder: fname,
                        svgStats: svgStats,
                        preserved: false,
                        transforms: this._importTransformationSettings,
                        variant: null,
                        index: i
                    };

                this._importList.push(entryOptions);

            }
            catch (e) { console.error(e); }
        }

        if (this._importList.length == 0) {
            this._Cancel();
            return;
        }


        if (!this._importEditor) { this._importEditor = nkm.ui.UI.Rent(`mkf-list-import-editor`); }

        // TODO
        // this._importTransformationSettings.Set(IDS_EXT.IMPORT_BLOCK, UNICODE.instance._blockCatalog.At(0) );

        this._importEditor.family = family;
        this._importEditor._currentDisplayRange = this._emitter._displayRange;
        this._importEditor._importList = this._importList;
        this._importEditor._importSelection = this._emitter.inspectedData;
        this._importEditor.data = this._importTransformationSettings;

        this._blockingDialog.Consume();
        this._blockingDialog = null;

        nkm.dialog.Push({
            title: `List import`,
            //message: `Tweak the imported data to make sure it fits!`,
            content: [{ cl: this._importEditor, donotrelease: true }],
            actions: [
                { label: `Import`, icon: `load-arrow`, flavor: nkm.com.FLAGS.LOADING, trigger: { fn: this._OnImportContinue } }, //variant: nkm.ui.FLAGS.FRAME
                { label: `Cancel`, trigger: { fn: this._Cancel, thisArg: this } }
            ],
            icon: `directory-download`,
            grow: true,
            origin: this,
        });

    }

    _OnImportContinue() {

        //Go through the catalog

        let family = this._emitter.data,
            trValues = this._importTransformationSettings.Values(),
            overlapMode = this._importTransformationSettings.Get(mkfData.IDS_EXT.IMPORT_OVERLAP_MODE);

        this._emitter.StartActionGroup({
            icon: `directory-download`,
            name: `Import SVGs`,
            title: `Imported SVGs as glyph`
        });

        for (let i = 0; i < this._importList.length; i++) {
            let
                item = this._importList[i],
                targetUnicode = item.targetUnicode,
                svgStats = item.svgStats;

            if (item.outOfRange
                || !item.userDoImport
                || !targetUnicode) {
                continue;
            }

            let unicodeInfos = UNICODE.GetInfos(targetUnicode, true);

            if (!unicodeInfos) {
                continue;
            }

            let existingGlyph = family.GetGlyph(unicodeInfos.u);

            if (existingGlyph.isNull) {

                this._emitter.Do(mkfActions.CreateGlyph, {
                    family: family,
                    unicode: unicodeInfos,
                    path: svgStats,
                    transforms: trValues
                });

            } else {

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

    _PreprocessFileList(p_list) {

        let names = {};

        searchloop: for (let i = 0; i < p_list.length; i++) {
            let
                filePath = nkm.u.PATH.Sanitize(p_list[i]),
                filename = nkm.u.PATH.name(filePath);

            p_list[i] = filePath;

            floop: for (let c = 0; c < filename.length; c++) {
                if (c < 1) { continue; }
                let n = filename.substr(0, c);
                try {
                    let nplus = filename.substr(0, c + 1);
                    if (nplus.includes(`U+`)) { break floop; }
                } catch (e) { }
                if (n in names) {
                    names[n].count++;
                } else {
                    names[n] = { name: n, count: 1 };
                }
            }
        }

        let maxCount = 0;
        let foundName = ``;

        for (var n in names) {
            let nin = names[n];
            if (nin.count == p_list.length) {
                if (nin.name.length > maxCount) {
                    foundName = nin.name;
                }
            }
        }

        if (foundName.length > 0) {
            this._importTransformationSettings.Set(mkfData.IDS_EXT.IMPORT_PREFIX, foundName);
        }

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

module.exports = CmdImportFileList;