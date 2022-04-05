//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const CmdViewportContent = require(`./cmd-viewport-content`);

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdImportViewportEmpty extends CmdViewportContent {
    constructor() { super(); }

    _Init() {
        super._Init();
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

        let editor = this._emitter.editor,
            svgStats = SVGOPS.EmptySVGStats();

        editor.StartActionGroup({ title: `Create empty glyphs` });

        for (let i = 0; i < list.length; i++) {
            editor.Do(mkfActions.CreateGlyph, {
                family: this._family,
                unicode: list[i],
                path: svgStats
            });
        }

        editor.EndActionGroup();

        this._Success();

    }

    _ProcessInfo(p_unicodeInfos) {
        let glyph = this._family.GetGlyph(p_unicodeInfos.u);
        if (glyph.isNull) { return p_unicodeInfos; }
        return null;
    }

}

module.exports = CmdImportViewportEmpty;