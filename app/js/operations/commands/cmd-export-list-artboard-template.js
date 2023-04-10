'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;
const path = require(`path`);

const { app, clipboard } = require('electron');
const fs = require('fs');

const nkmElectron = require('@nkmjs/core/electron');

const CmdListProcessor = require(`./cmd-list-processor`);

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);
const { join } = require('path');

class CmdExportListArtboartTemplate extends CmdListProcessor {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._Bind(this._OnPicked);
        this._Bind(this._OnWriteSuccess);
        this._Bind(this._OnWriteFail);

        this._tmpRsc = new nkmElectron.io.helpers.TempResourceWatcher();

    }

    _ProcessInfo(p_unicodeInfos) { return UNICODE.UUni(p_unicodeInfos); }

    _InternalExecute() {

        super._InternalExecute();

        if (this._results.length == 0) {
            this._Cancel();
            return;
        }

        this._tmpRsc.Flush();
        this._Kickstart();
    }

    _Kickstart() {

        let
            illuAppPath = nkm.settings.Get(mkfData.IDS_PREFS.ILLU_PATH);

        try {
            let stats = fs.statSync(illuAppPath[0]);
            if (!stats || !stats.isFile()) { throw new Error(); }
        } catch (e) {
            // Default path is either not set or invalid
            nkm.actions.RELAY.ShowOpenDialog({
                properties: ['openFile'],
                title: `Select Adobe© Illustrator executable`
            }, this._OnPicked);
            return;
        }

        let
            list = super._InternalExecute(),
            jsxContent;

        try {
            jsxContent = fs.readFileSync(path.join(...u.FULL(`%APP%`).split(u.tils.DELIM_DIR), `assets`, `mkartboard-tpl.jsx`), 'utf8');
        } catch (e) {
            jsxContent = fs.readFileSync(path.resolve(`assets`, `mkartboard-tpl.jsx`), 'utf8');
        }

        if (list.length > 1000) {
            list.length = 1000;
            nkm.dialog.Push({
                title: `Illustrator limitations`,
                message: `Illustrator limits the number of artboard to 1,000, and your selection has ${list.length} glyphs.<br>Only the first 1,000 glyphs will handled :(`,
                actions: [
                    { label: `Okay` }
                ],
                icon: `app-illustrator`,
                flavor: nkm.com.FLAGS.WARNING,
                origin: this,
            });
        }

        for (let i = 0; i < Math.min(list.length, 1000); i++) { list[i] = `"${list[i]}"`; }

        jsxContent = jsxContent.split(`%unicodeList%`).join(list.join(`,`));

        this._tmpRsc.Create({
            ext: `.jsx`,
            cl: nkm.io.resources.TextResource
        }, { discardDescriptor: true });

        this._tmpRsc.Write(
            jsxContent,
            {
                success: this._OnWriteSuccess,
                fail: this._OnWriteFail
            }
        );

    }

    _OnWriteSuccess(p_rsc) {
        this._Launch();
        this._Success();
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
        nkm.settings.Set(mkfData.IDS_PREFS.ILLU_PATH, [filePath]);

        this._Kickstart();

    }

    _Launch() {

        let
            illuAppPath = nkm.settings.Get(mkfData.IDS_PREFS.ILLU_PATH);

        nkmElectron.io.LaunchExternalEditor(illuAppPath[0], this._tmpRsc.path);
        this._tmpRsc.Enable();

    }

}

module.exports = CmdExportListArtboartTemplate;