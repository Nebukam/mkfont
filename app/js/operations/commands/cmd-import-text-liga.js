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

class CmdImportTextLiga extends actions.Command {
    constructor() { super(); }

    _Init() {

        super._Init();

        this._Bind(this._OnImportContinueAll);
        this._Bind(this._OnImportContinue);

        this._importEditor = null;

    }

    set glyphInfos(p_value) { this._glyphInfos = p_value; }
    get glyphInfos() { return this._glyphInfos; }

    _InternalExecute() {

        if (!this._importEditor) {
            this._importEditor = nkm.ui.UI.Rent(`mkfont-liga-import-editor`);
        }

        this._importEditor.data = this._context;

        nkm.dialog.Push({
            title: `Ligatures finder`,
            //message: `Tweak the imported data to make sure it fits!`,
            content: [{ cl: this._importEditor, donotrelease: true }],
            actions: [
                { label: `Create all`, icon: `load-arrow-small`, flavor: nkm.com.FLAGS.LOADING, trigger: { fn: this._OnImportContinueAll } }, //variant: nkm.ui.FLAGS.FRAME
                { label: `Create selected`, icon: `load-arrow-small`, flavor: nkm.com.FLAGS.LOADING, variant: nkm.ui.FLAGS.FRAME, trigger: { fn: this._OnImportContinue } }, //variant: nkm.ui.FLAGS.FRAME
                { label: `Cancel`, trigger: { fn: this._Cancel, thisArg: this } }
            ],
            icon: `font-liga`,
            grow: true,
            origin: this,
        });

    }

    _OnImportContinueAll() {
        this._ProcessResults(this._importEditor._results);
    }

    _OnImportContinue() {
        let filteredResults = [];
        for (let i = 0; i < this._importEditor._results.length; i++) {
            let liga = this._importEditor._results[i];
            if (liga.export) { filteredResults.push(liga); }
        }
        this._ProcessResults(filteredResults);
    }

    _ProcessResults(p_results) {

        let
            editor = this._emitter.editor,
            family = this._context;

        editor.StartActionGroup({ title: `Import SVGs` });

        for (let i = 0; i < p_results.length; i++) {
            let liga = p_results[i],
                uniStruct = [];

            for (let c = 0; c < liga.ligature.length; c++) {
                uniStruct.push(UNICODE.GetAddress(liga.ligature.substr(c, 1)));
            }

            let
                unicodeInfos = UNICODE.GetInfos(uniStruct, true),
                existingGlyph = family.GetGlyph(unicodeInfos.u);

            if (existingGlyph.isNull) {
                editor.Do(mkfActions.CreateGlyph, {
                    family: family,
                    unicode: unicodeInfos,
                    path: SVGOPS.EmptySVGStats()
                });
            }

        }

        editor.EndActionGroup();

        this._Success();
    }

    _OnImportCancel() {
        this._Cancel();
    }

    _End() {
        if (this._importEditor) { this._importEditor.catalog = null; }
        super._End();
    }

}

module.exports = CmdImportTextLiga;