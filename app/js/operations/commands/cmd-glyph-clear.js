'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);
const SHARED_OPS = require('./shared-ops');

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
                    variant = family.GetGlyph(infos.u).activeVariant;

                this._Empty(variant, infos, true);
            }

            this._emitter.EndActionGroup();

        } else {
            // Check if glyph exists
            this._Empty(this._context, this._context.glyph.unicodeInfos, false);
        }

        this._Success();

    }

    _Empty(p_variant, p_infos, p_inGroup) {

        let glyph = p_variant.glyph;


        let f = this._emitter.data;

        if (glyph.isNull) {

            if (!p_inGroup && (nkm.ui.INPUT.alt || nkm.ui.INPUT.shift)) {
                this._emitter.StartActionGroup({
                    icon: `reset`,
                    name: `Reset glyph`,
                    title: `Clears selected glyphs data`
                });
            }

            SHARED_OPS.CreateEmptyGlyph(this._emitter, f, p_infos);

            if (nkm.ui.INPUT.shift) {
                SHARED_OPS.BoostrapComp(this._emitter, f.GetGlyph(p_infos.u).activeVariant, p_infos, true, nkm.ui.INPUT.alt);
            }

            if (!p_inGroup && (nkm.ui.INPUT.alt || nkm.ui.INPUT.shift)) { this._emitter.EndActionGroup(); }

        } else {

            if (!p_inGroup) {
                this._emitter.StartActionGroup({
                    icon: `reset`,
                    name: `Reset glyph`,
                    title: `Clears selected glyphs data`
                });
            }

            this._emitter.Do(mkfActions.SetPropertyMultiple, {
                target: p_variant,
                values: {
                    [mkfData.IDS.WIDTH]: f.Get(mkfData.IDS.WIDTH),
                    [mkfData.IDS.PATH_DATA]: SVGOPS.EmptySVGStats()
                }
            });

            this._emitter.Do(mkfActions.SetProperty, {
                target: p_variant._transformSettings,
                id: mkfData.IDS.TR_AUTO_WIDTH,
                value: false
            });

            if (!nkm.ui.INPUT.alt) { SHARED_OPS.RemoveLayers(this._emitter, p_variant); }

            if (nkm.ui.INPUT.shift) { SHARED_OPS.BoostrapComp(this._emitter, p_variant, p_infos, true, nkm.ui.INPUT.alt); }

            if (!p_inGroup) { this._emitter.EndActionGroup(); }

        }

        this._emitter._bindingManager.Unbind(p_variant);
        glyph.CommitUpdate();

    }

}

module.exports = CmdGlyphClear;