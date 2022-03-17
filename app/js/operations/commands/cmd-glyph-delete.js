//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.utils;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdGlyphDelete extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();

        this._glyphInfos = null;
    }

    set glyphInfos(p_value) { this._glyphInfos = p_value; }
    get glyphInfos() { return this._glyphInfos; }

    _InternalExecute() {


        let
            editor = this._emitter.editor,
            family = editor.data;

        let
            glyph = this._context.glyph;

        editor.Do(mkfActions.DeleteGlyph, {
            glyph: glyph,
            family: family
        });

        this._Success();

    }

}

module.exports = CmdGlyphDelete;