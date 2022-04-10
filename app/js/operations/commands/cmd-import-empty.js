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
    }

    _InternalExecute() {

        let
            editor = this._emitter.editor,
            family = editor.data;

        if (u.isArray(this._context)) {

            editor.StartActionGroup({
                icon: `new`,
                name: `Batch empty glyph`,
                title: `Emptied selected glyphs`
            });

            for (let i = 0; i < this._context.length; i++) {

                let infos = this._context[i],
                    variant = family.GetGlyph(infos.u).GetVariant(family.selectedSubFamily);

                this._Empty(editor, family, variant, infos);
            }

            editor.EndActionGroup();

        } else {
            // Check if glyph exists
            this._Empty(editor, family, this._context, this._context.glyph.unicodeInfos);
        }

        this._Success();

    }

    _Empty(p_editor, p_family, p_variant, p_infos) {

        let
            glyph = p_variant.glyph,
            svgStats = SVGOPS.EmptySVGStats();

        if (glyph.isNull) {
            // Need to create a new glyph!
            p_editor.Do(mkfActions.CreateGlyph, {
                family: p_family,
                unicode: p_infos,
                path: svgStats
            });
        } else {
            p_editor.Do(mkfActions.SetProperty, {
                target: p_variant,
                id: mkfData.IDS.PATH_DATA,
                value: svgStats
            });
        }

        glyph.CommitUpdate();

    }

}

module.exports = CmdImportEmpty;