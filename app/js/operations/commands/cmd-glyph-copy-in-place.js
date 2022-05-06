'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdGlyphCopyInPlace extends actions.Command {
    constructor() { super(); }

    _InternalExecute() {

        globalThis.__copySourceEM = null;

        let family = this._emitter.data,
            infoList = this._emitter.inspectedData.stack._array;

        if (globalThis.__copySourceGlyphs) { globalThis.__copySourceGlyphs.length = 0; }
        globalThis.__copySourceGlyphs = null;
        globalThis.__copySourceEM = null;
        globalThis.__copySourceFamily = null;

        if (infoList.length == 0) {
            this._Cancel();
            return;
        }

        let copies = [];
        infoList.forEach(unicodeInfos => {
            let g = family.GetGlyph(unicodeInfos.u);
            if (!g.isNull) { copies.push(g); }
        });

        if (copies.length == 0) {
            this._Cancel();
            return;
        }

        globalThis.__copySourceGlyphs = copies;
        globalThis.__copySourceEM = family.Get(mkfData.IDS.EM_UNITS);
        globalThis.__copySourceFamily = family;


        this._Success();
    }

}

module.exports = CmdGlyphCopyInPlace;