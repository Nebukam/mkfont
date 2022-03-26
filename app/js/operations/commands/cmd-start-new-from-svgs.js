//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfCatalog = require(`../../catalogs`);
const mkfActions = require(`../actions`);

const CmdStartNewMKFont = require(`./cmd-start-new-mkfont`);

class CmdStartNewMKFontFromSVGs extends CmdStartNewMKFont {
    constructor() { super(); }

    static __defaultName = `New .mkfont from SVGs`;
    static __defaultIcon = `directory-download-small`;

    _Init() {
        super._Init();

        this._Bind(this._OnPicked);

        this._importCatalog = nkm.data.catalogs.CreateFrom({
            name: `Import list`,
            localItemClass: mkfCatalog.Import,
            expanded: true
        });

        this._importEditor = null;
        this._importTransformationSettings = new mkfData.ImportSettings();

    }

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

        this._newFamily = nkm.com.Rent(mkfData.Family);
        this._newFamily.defaultSubFamily._UpdateDisplayValues();

        let subFamily = this._newFamily.selectedSubFamily;
        this._importCatalog.Clear();

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
            list = this._importCatalog._items,
            trValues = this._importTransformationSettings.Values();

        for (let i = 0; i < list.length; i++) {

            let item = list[i],
                svgStats = item.GetOption(`svgStats`),
                useCustom = item.GetOption(`use-custom-unicode`),
                uniStruct = useCustom ? item.GetOption(`unicode-user-input`) : item.GetOption(`name`);

            uniStruct = this._importEditor._FindUnicodeStructure(uniStruct);

            if (uniStruct.length == 0) { continue; }

            let
                unicodeInfos = UNICODE.GetInfos(uniStruct, true),
                newGlyph = nkm.com.Rent(mkfData.Glyph),
                glyphVariant = newGlyph._defaultGlyph;

            newGlyph.Set(mkfData.IDS.UNICODE, unicodeInfos.u);
            newGlyph.unicodeInfos = unicodeInfos;

            glyphVariant.Set(mkfData.IDS.PATH_DATA, svgStats);
            glyphVariant.transformSettings.BatchSet(trValues);

            this._newFamily.AddGlyph(newGlyph);
            glyphVariant.transformSettings.UpdateTransform();

        }

        this._RequestEdit();

    }

}

module.exports = CmdStartNewMKFontFromSVGs;