//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdImportEmpty extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();

        this._glyphInfos = null;
    }

    set glyphInfos(p_value) { this._glyphInfos = p_value; }
    get glyphInfos() { return this._glyphInfos; }

    _InternalExecute() {

        let svgStats = SVGOPS.EmptySVGStats();

        let
            editor = this._emitter.editor,
            family = editor.data;

        // Check if glyph exists
        let
            variant = this._context,
            glyph = variant.glyph,
            unicodeInfos;

        if (glyph.isNull) {
            // Need to create a new glyph!
            unicodeInfos = glyph.unicodeInfos;
            editor.Do(mkfActions.CreateGlyph, {
                family: family,
                unicode: unicodeInfos,
                path: svgStats
            });
        } else {
            editor.Do(mkfActions.SetProperty, {
                target: variant,
                id: mkfData.IDS.PATH_DATA,
                value: svgStats
            });
        }

        glyph.CommitUpdate();
        this._Success();

    }

}

module.exports = CmdImportEmpty;