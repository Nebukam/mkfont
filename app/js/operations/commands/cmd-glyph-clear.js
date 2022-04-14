//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdGlyphClear extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
    }

    _InternalExecute() {

        let family = this._emitter.data;

        if (u.isArray(this._context)) {

            this._emitter.StartActionGroup({
                icon: `new`,
                name: `Batch clear glyph`,
                title: `Clears selected glyphs data`
            });

            for (let i = 0; i < this._context.length; i++) {

                let infos = this._context[i],
                    variant = family.GetGlyph(infos.u).GetVariant(family.selectedSubFamily);

                this._Empty(variant, infos);
            }

            this._emitter.EndActionGroup();

        } else {
            // Check if glyph exists
            this._Empty(this._context, this._context.glyph.unicodeInfos);
        }

        this._Success();

    }

    _Empty(p_variant, p_infos) {

        let
            glyph = p_variant.glyph,
            svgStats = SVGOPS.EmptySVGStats();

        if (glyph.isNull) {
            // Need to create a new glyph!
            this._emitter.Do(mkfActions.CreateGlyph, {
                family: this._emitter.data,
                unicode: p_infos,
                path: svgStats
            });
        } else {
            this._emitter.Do(mkfActions.SetProperty, {
                target: p_variant,
                id: mkfData.IDS.PATH_DATA,
                value: svgStats
            });
        }

        glyph.CommitUpdate();

    }

}

module.exports = CmdGlyphClear;