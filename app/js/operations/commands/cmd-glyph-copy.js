'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);
const SHARED_OPS = require('./shared-ops');


class CmdGlyphCopy extends actions.Command {
    constructor() { super(); }

    _InternalExecute() {
        SHARED_OPS.CopyFrom(this._emitter);
        this._Success();

    }

}

module.exports = CmdGlyphCopy;