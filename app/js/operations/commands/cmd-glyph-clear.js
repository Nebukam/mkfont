'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
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

        let
            glyph = p_variant.glyph,
            svgStats = SVGOPS.EmptySVGStats();


        let f = this._emitter.data;

        if (glyph.isNull) {

            if (!p_inGroup && nkm.ui.INPUT.alt) {
                this._emitter.StartActionGroup({
                    icon: `reset`,
                    name: `Reset glyph`,
                    title: `Clears selected glyphs data`
                });
            }

            // Need to create a new glyph!
            this._emitter.Do(mkfActions.GlyphCreate, {
                family: f,
                unicode: p_infos,
                path: svgStats,
                transforms: {
                    [mkfData.IDS.WIDTH]: f.Get(mkfData.IDS.WIDTH),
                    [mkfData.IDS.TR_AUTO_WIDTH]: false
                }
            });

            if (nkm.ui.INPUT.alt) { this._emitter.cmdLayerAddComp.Execute(f.GetGlyph(p_infos.u).activeVariant); }

            if (!p_inGroup && nkm.ui.INPUT.alt) { this._emitter.EndActionGroup(); }

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
                    [mkfData.IDS.PATH_DATA]: svgStats
                }
            });

            this._emitter.Do(mkfActions.SetProperty, {
                target: p_variant._transformSettings,
                id: mkfData.IDS.TR_AUTO_WIDTH,
                value: false
            });

            SHARED_OPS.RemoveLayers(this._emitter, p_variant);

            if (nkm.ui.INPUT.alt) { this._emitter.cmdLayerAddComp.Execute(p_variant); }

            if (!p_inGroup) { this._emitter.EndActionGroup(); }
        }

        this._emitter._bindingManager.Unbind(p_variant);
        glyph.CommitUpdate();

    }

}

module.exports = CmdGlyphClear;