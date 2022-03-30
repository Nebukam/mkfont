//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.utils;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfCatalog = require(`../../catalogs`);
const mkfActions = require(`../actions`);

class CmdImportExternalFileMultiple extends actions.Command {
    constructor() { super(); }

    _Init() {

        super._Init();

        this._Bind(this._OnPicked);
        this._Bind(this._OnImportContinue);

        this._importCatalog = nkm.data.catalogs.CreateFrom({
            name: `Import list`,
            localItemClass: mkfCatalog.Import,
            expanded: true
        });

        this._importEditor = null;
        this._importTransformationSettings = new mkfData.ImportSettings();

    }

    set glyphInfos(p_value) { this._glyphInfos = p_value; }
    get glyphInfos() { return this._glyphInfos; }

    _InternalExecute() {

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

        let subFamily = this._context.selectedSubFamily;
        this._importCatalog.Clear();

        this._PreprocessFileList(list);


        for (let i = 0; i < list.length; i++) {

            let filePath = list[i];

            try {

                let
                    svgString = fs.readFileSync(filePath, 'utf8'),
                    svgStats = SVGOPS.SVGStats(svgString);

                if (!svgStats.exists) { continue; }

                let entryOptions = {
                    filePath: filePath,
                    name: nkm.utils.PATH.name(filePath),
                    ['use-custom-unicode']: false,
                    ['unicode-user-input']: nkm.utils.PATH.name(filePath),
                    svgStats: svgStats,
                    subFamily: subFamily,
                    transforms: this._importTransformationSettings
                };

                this._importCatalog.Register(entryOptions);

            }
            catch (e) { console.error(e); }
        }

        if (this._importCatalog.count == 0) {
            this._Cancel();
            return;
        }

        //this._importInspector.data = ;

        if (!this._importEditor) {
            this._importEditor = nkm.ui.UI.Rent(`mkfont-list-import-editor`);
        }

        //this._importTransformationSettings

        this._importEditor.subFamily = subFamily;
        this._importEditor.data = this._importTransformationSettings;
        this._importEditor.catalog = this._importCatalog;

        nkm.dialog.Push({
            title: `List import`,
            //message: `Tweak the imported data to make sure it fits!`,
            content: [{ cl: this._importEditor, donotrelease: true }],
            actions: [
                { label: `Import`, icon: `load-arrow-small`, flavor: nkm.com.FLAGS.LOADING, trigger: { fn: this._OnImportContinue } }, //variant: nkm.ui.FLAGS.FRAME
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
            editor = this._emitter.editor,
            family = editor.data,
            list = this._importCatalog._items,
            trValues = this._importTransformationSettings.Values();

        editor.StartActionGroup({ title: `Import SVGs` });

        for (let i = 0; i < list.length; i++) {
            let item = list[i],
                svgStats = item.GetOption(`svgStats`),
                useCustom = item.GetOption(`use-custom-unicode`),
                uniStruct = useCustom ? item.GetOption(`unicode-user-input`) : item.GetOption(`name`);

            uniStruct = this._importEditor._FindUnicodeStructure(uniStruct);

            if (uniStruct.length == 0) { continue; }

            let
                unicodeInfos = UNICODE.GetInfos(uniStruct, true),
                existingGlyph = family.GetGlyph(unicodeInfos.u);

            if (existingGlyph.isNull) {
                editor.Do(mkfActions.CreateGlyph, {
                    family: family,
                    unicode: unicodeInfos,
                    path: svgStats,
                    transforms: trValues
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
                    values: trValues
                });
            }

        }

        editor.EndActionGroup();

        this._Success();
    }

    _PreprocessFileList(p_list) {

        let names = {};

        for (let i = 0; i < p_list.length; i++) {
            let
                filePath = nkm.utils.PATH.Sanitize(p_list[i]),
                filename = nkm.utils.PATH.name(filePath);

            p_list[i] = filePath;

            for (let c = 0; c < filename.length; c++) {
                if (c < 1) { continue; }
                let n = filename.substr(0, c);
                if (n in names) {
                    names[n].count++;
                } else {
                    names[n] = { name: n, count: 1 };
                }
            }
        }

        let maxCount = 0;
        let foundName = ``;

        for(var n in names){
            let nin = names[n];
            if(nin.count == p_list.length){
                if(nin.name.length > maxCount){
                    foundName = nin.name;
                }
            }
        }

        if(foundName.length > 0){
            this._importTransformationSettings.Set(mkfData.IDS.IMPORT_PREFIX, foundName);
        }

    }

    _OnImportCancel() {
        this._Cancel();
    }

    _End() {
        if (this._importEditor) { this._importEditor.catalog = null; }
        super._End();
    }

}

module.exports = CmdImportExternalFileMultiple;