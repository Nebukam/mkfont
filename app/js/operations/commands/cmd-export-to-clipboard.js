//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.utils;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdExportToClipboard extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
    }

    set glyphInfos(p_value) { this._glyphInfos = p_value; }
    get glyphInfos() { return this._glyphInfos; }

    _InternalExecute() {
        try {
            let string = `<svg><path d="${this._context.Get(mkfData.IDS.PATH_DATA).path}"></path></svg>`;
            clipboard.writeText(string);
        } catch (e) { }
        this._Success();
    }

}

module.exports = CmdExportToClipboard;