//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

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

        console.log(this._context);

        if (u.isArray(this._context)) {

            // Delete a selection of glyphs

            editor.StartActionGroup({
                icon: `remove`,
                name: `Batch glyph delete`,
                title: `Deleted selected glyphs.`
            });

            for (let i = 0; i < this._context.length; i++) {
                this._Delete(editor, family, family.GetGlyph(this._context[i].u));
            }

            editor.EndActionGroup();

        } else if (u.isInstanceOf(this._context, mkfData.GlyphVariant)) {
            // Delete a single glyph
            this._Delete(editor, family, this._context.glyph);
        } else {
            this._Fail(`Context is neither a glyph variant nor a selection.`);
            return;
        }

        this._Success();

    }

    _Delete(p_editor, p_family, p_glyph) {

        if (p_glyph.isNull) { return; }

        p_editor.Do(mkfActions.DeleteGlyph, {
            glyph: p_glyph,
            family: p_family
        });
    }

}

module.exports = CmdGlyphDelete;