//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const UNICODE = require(`../../unicode`);
const IDS_EXT = require(`../../data/ids-ext`);

class CmdViewportContent extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._results = [];
    }

    _InternalExecute() {

        this._results.length = 0;

        let content = this._context;

        for (let i = 0, n = content.length; i < n; i++) { this._PushInfos(content[i]); }
        return this._results;

    }

    //#region fetch methods

    _ProcessInfo(p_unicodeInfos) {
        return p_unicodeInfos;
    }

    _PushInfos(p_unicodeInfos) {
        let res = this._ProcessInfo(p_unicodeInfos);
        if (res != null) { this._results.push(res); }
    }

    //#endregion

}

module.exports = CmdViewportContent;