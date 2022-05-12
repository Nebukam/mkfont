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
const SHARED_OPS = require('./shared-ops');

class CmdImportListMissingGlyphs extends CmdListProcessor {
    constructor() { super(); }

    static __displayName = `Create empty glyphs`;
    static __displayIcon = `new`;

    _Init() {
        super._Init();
        this._Bind(this._Confirm);
        this._Bind(this._Cancel);
    }

    _InternalExecute() {

        this._family = this._emitter.data;

        if (!u.isInstanceOf(this._family, mkfData.Family)) {
            this._Fail(`not a family`);
            return;
        }

        let list = super._InternalExecute();
        if (list.length == 0) {
            this._Cancel();
            return;
        }

        if (list.length > 300) {
            nkm.dialog.Push({
                title: `So many glyphs!`,
                message: `You're about to create ${list.length} glyphs at once.<br>This will impact performance.`,
                actions: [
                    {
                        label: `Confirm`, icon: `warning`,
                        flavor: nkm.com.FLAGS.WARNING,
                        trigger: { fn: this._Confirm }

                    }, //variant: nkm.ui.FLAGS.FRAME
                    { label: `Cancel`, trigger: { fn: this._Cancel } }
                ],
                icon: `warning`,
                flavor: nkm.com.FLAGS.WARNING,
                origin: this,
            });
            return;
        }

        this._Confirm();

    }

    _ProcessInfo(p_unicodeInfos) {
        let glyph = this._family.GetGlyph(p_unicodeInfos.u);
        if (glyph.isNull) { return p_unicodeInfos; }
        return null;
    }

    _Confirm() {

        let list = this._results;

        this._emitter.StartActionGroup({
            icon: `new`,
            name: `Batch glyph creation`,
            title: `Created new glyphs from viewport selection`
        });

        list.forEach(uinfos =>{ SHARED_OPS.CreateEmptyGlyph(this._emitter, this._family, uinfos); });

        this._emitter.EndActionGroup();

        this._Success();

    }

}

module.exports = CmdImportListMissingGlyphs;