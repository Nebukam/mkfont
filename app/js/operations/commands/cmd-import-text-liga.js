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

        this._Bind(this._OnImportContinue);

        this._importEditor = null;

    }

    set glyphInfos(p_value) { this._glyphInfos = p_value; }
    get glyphInfos() { return this._glyphInfos; }

    _InternalExecute() {

        if (!this._importEditor) {
            this._importEditor = nkm.ui.UI.Rent(`mkfont-list-import-editor`);
        }

        nkm.dialog.Push({
            title: `Ligatures finder`,
            //message: `Tweak the imported data to make sure it fits!`,
            content: [{ cl: this._importEditor, donotrelease: true }],
            actions: [
                { label: `Import`, icon:`load-arrow-small`, flavor: nkm.com.FLAGS.LOADING, trigger: { fn: this._OnImportContinue } }, //variant: nkm.ui.FLAGS.FRAME
                { label: `Cancel`, trigger: { fn: this._Cancel, thisArg: this } }
            ],
            icon: `font-liga`,
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

        editor.StartActionGroup({ title: `Create ligatures` });


        editor.EndActionGroup();

        this._Success();
    }

    _OnImportCancel() {
        this._Cancel();
    }

    _End() {
        if(this._importEditor){ this._importEditor.catalog = null; }
        super._End();
    }

}

module.exports = CmdImportTextLiga;