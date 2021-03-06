'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdExportSingleUniHex extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
    }

    _InternalExecute() {
        console.log(this._context);
        let val = u.isString(this._context) ? this._context : UNICODE.UUni(this._context);
        navigator.clipboard.writeText(val.toUpperCase());
        this._Success();
    }

}

module.exports = CmdExportSingleUniHex;