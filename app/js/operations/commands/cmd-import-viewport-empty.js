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

    static __defaultName = `Create empty glyphs`;
    static __defaultIcon = `new`;

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

        let editor = this._emitter.editor,
            svgStats = SVGOPS.EmptySVGStats();

        editor.StartActionGroup({
            icon: `new`,
            name: `Batch glyph creation`,
            title: `Created new glyphs from viewport selection`
        });

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

}

module.exports = CmdImportViewportEmpty;