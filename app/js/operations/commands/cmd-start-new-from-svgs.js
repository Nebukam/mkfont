'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfCatalog = require(`../../catalogs`);
const mkfActions = require(`../actions`);

const CmdCreateFamilyDoc = require(`./cmd-start-new-mkfont`);

class CmdCreateFamilyDocFromSVGs extends CmdCreateFamilyDoc {
    constructor() { super(); }

    static __displayName = `New .mkfont from SVGs`;
    static __displayIcon = `directory-download-small`;

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

        let document = this._GetDoc(true);

        this._newFamily = document.currentData;
        this._newFamily._UpdateDisplayValues();

        for (let i = 0; i < list.length; i++) {

            let filePath = nkm.u.PATH.Sanitize(list[i]);

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

        this._importEditor.family = this._newFamily;
        this._importEditor._importList = this._importList;
        this._importEditor._importSelection = null;
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

        let trValues = this._importTransformationSettings.Values();

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

            if (!unicodeInfos) { continue; }

            let
                newGlyph = nkm.com.Rent(mkfData.Glyph),
                glyphVariant = newGlyph.activeVariant;

            newGlyph.Set(mkfData.IDS.UNICODE, unicodeInfos.u);
            newGlyph.unicodeInfos = unicodeInfos;

            glyphVariant.Set(mkfData.IDS.PATH_DATA, svgStats);
            glyphVariant.transformSettings.BatchSet(trValues);

            this._newFamily.AddGlyph(newGlyph);
            glyphVariant.transformSettings.UpdateTransform();

        }

        this._RequestEdit();

    }

    _End() {
        if (this._blockingDialog) { this._blockingDialog.Consume(); }
        super._End();
    }

}

module.exports = CmdCreateFamilyDocFromSVGs;