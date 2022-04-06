//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const ui = nkm.ui;
const u = nkm.u;

const fs = require('fs');

const nkmElectron = require('@nkmjs/core/electron');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);


class CmdEditInPlace extends actions.Command {
    constructor() { super(); }

    static __defaultName = `Edit in place`;
    static __defaultIcon = `document-edit`;

    _Init() {
        super._Init();
        this._Bind(this._OnPicked);
        this._Bind(this._OnWriteSuccess);
        this._Bind(this._OnWriteFail);

        this._cachedEditor = null;
        this._cachedContext = null;

        this._tmpRsc = new nkmElectron.io.helpers.TempResourceWatcher();
        this._tmpRsc.Hook(nkm.io.IO_SIGNAL.READ_COMPLETE, this._OnReadComplete, this);
        this._tmpRsc.readOnChange = true;

    }

    _InternalExecute() {

        if (this._cachedEditor == this._emitter.editor
            && this._cachedContext == this._context) {
            this._Launch();
            this._Success();
            return;
        }

        this._cachedEditor = null;
        this._cachedContext = null;

        this._tmpRsc.Flush();
        this._Kickstart();
    }

    _Kickstart() {

        let
            defaultEditorPath = nkm.env.APP.PGet(mkfData.IDS_PREFS.SVG_EDITOR_PATH);

        try {
            let stats = fs.statSync(defaultEditorPath[0]);
            if (!stats || !stats.isFile()) { throw new Error(); }
        } catch (e) {
            // Default path is either not set or invalid
            nkm.actions.RELAY.ShowOpenDialog({
                //defaultPath: this._currentValue ? this._currentValue : ``,
                //filters: [{ name: 'SVG files', extensions: ['svg'] }],
                properties: ['openFile'],
                title: `Select default SVG Editor Application`
            }, this._OnPicked);
            return;
        }

        this._cachedEditor = this._emitter.editor;
        this._cachedContext = this._context;

        //TODO : Option to "bind to file" for the session
        //TODO : Here, check if a resource is currently bound before using a temp file

        this._tmpRsc.Create({
            ext: `.svg`,
            cl: nkm.io.resources.TextResource
        }, { discardDescriptor: true });

        this._tmpRsc.Write(
            SVGOPS.SVGFromGlyphVariant(this._context, true),
            {
                success: this._OnWriteSuccess,
                fail: this._OnWriteFail
            }
        );
        // TODO : 
        // Create temp file
        // Watch temp file
        // Update data as file is being edited
        // Stop watching file & destroy it when context changes or executed again
        this._Success();

    }

    _OnWriteSuccess(p_rsc) {
        this._Launch();
    }

    _OnReadComplete(p_rsc) {
        // Update SVG DATA

        let svgStats = { exists: false };

        try {
            svgStats = SVGOPS.SVGStats(p_rsc.raw);
        } catch (e) { console.log(e); }

        if (!svgStats.exists) { return; }

        this._cachedEditor.Do(mkfActions.SetProperty, {
            target: this._cachedContext,
            id: mkfData.IDS.PATH_DATA,
            value: svgStats
        });

    }

    _OnWriteFail(p_err) {
        this._tmpRsc.Flush();
        this._Fail(p_err);
    }

    _OnPicked(p_response) {

        if (p_response.canceled) {
            this._Cancel();
            return;
        }

        let filePath = p_response.filePaths[0];
        nkm.env.APP.PSet(mkfData.IDS_PREFS.SVG_EDITOR_PATH, [filePath]);

        this._Kickstart();

    }

    _Launch() {

        let
            defaultEditorPath = nkm.env.APP.PGet(mkfData.IDS_PREFS.SVG_EDITOR_PATH);

        nkmElectron.io.LaunchExternalEditor(defaultEditorPath[0], this._tmpRsc.path);
        this._tmpRsc.Enable();
    }

}

module.exports = CmdEditInPlace;