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

const __groupInfos = {
    icon: `clipboard-read`,
    name: `Paste in place`,
    title: `Pasted glyphs from an mkfont to another`
};

class CmdGlyphPasteInPlace extends actions.Command {
    constructor() { super(); }

    _InternalExecute() {

        this._emitter.StartActionGroup(__groupInfos);

        let success = SHARED_OPS.PasteTo(this._emitter, SHARED_OPS.MODE_MATCH_SLOT);

        this._emitter.EndActionGroup();

        return success ? this._Success() : this._Fail();

    }

}

module.exports = CmdGlyphPasteInPlace;