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
                title: `Deleted glyphs from viewport selection`
            });

            for (let i = 0; i < this._context.length; i++) {

                let glyph = family.GetGlyph(this._context[i].u);

                if (glyph.isNull) { continue; }

                editor.Do(mkfActions.DeleteGlyph, {
                    glyph: glyph,
                    family: family
                });

            }

            editor.EndActionGroup();

        } else if (u.isInstanceOf(this._context, mkfData.GlyphVariant)) {

            // Delete a single glyph

            let
                glyph = this._context.glyph;

            editor.Do(mkfActions.DeleteGlyph, {
                glyph: glyph,
                family: family
            });

        } else {
            this._Fail(`Context is neither a glyph variant nor a selection.`);
            return;
        }

        this._Success();

    }

}

module.exports = CmdGlyphDelete;