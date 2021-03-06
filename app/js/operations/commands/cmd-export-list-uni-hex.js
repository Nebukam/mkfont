'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const CmdListProcessor = require(`./cmd-list-processor`);

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdExportListUniHex extends CmdListProcessor {
    constructor() { super(); }

    static __displayName = `Unicodes to clipboard`;
    static __displayIcon = `text-unicode`;

    _Init() {
        super._Init();
    }

    _InternalExecute() {

        let list = super._InternalExecute();

        let val = list.join(`\n`);
        navigator.clipboard.writeText(val);
        this._Success();

    }

    _ProcessInfo(p_unicodeInfos) {
        return UNICODE.UUni(p_unicodeInfos);
    }

}

module.exports = CmdExportListUniHex;