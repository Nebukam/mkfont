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

class CmdGlyphPasteInPlace extends actions.Command {
    constructor() { super(); }

    _InternalExecute() {

        let family = this._emitter.data;

        if (!globalThis.__copySourceGlyphs ||
            globalThis.__copySourceGlyphs.length == 0 ||
            globalThis.__copySourceFamily == family) {
            this._Cancel();
            return;
        }

        this._scaleFactor = globalThis.__copySourceEM ? family.Get(mkfData.IDS.EM_UNITS) / globalThis.__copySourceEM : 1;

        let
            resample = (this._scaleFactor != 1),
            nullCount = 0;

        globalThis.__copySourceGlyphs.forEach(g => { nullCount += g.isNull ? 1 : 0; });

        if (nullCount == globalThis.__copySourceGlyphs.length) {
            this._Cancel();
            return;
        }

        this._emitter.StartActionGroup({
            icon: `clipboard-read`,
            name: `Paste in place`,
            title: `Pasted glyphs from an mkfont to another`
        });

        for (let i = 0; i < globalThis.__copySourceGlyphs.length; i++) {
            let g = globalThis.__copySourceGlyphs[i];
            if (g.isNull) { continue; }
            this.PasteInPlace(family, g, resample);
        }

        this._emitter.EndActionGroup();

        this._Success();

    }

    PasteInPlace(p_family, p_sourceGlyph, p_resample = false) {

        let
            unicodeInfos = p_sourceGlyph.unicodeInfos,
            targetGlyph = p_family.GetGlyph(unicodeInfos.u),
            targetVariant = targetGlyph.activeVariant,
            sourceVariant = p_sourceGlyph.activeVariant,
            variantValues = sourceVariant.Values(),
            transforms = sourceVariant._transformSettings.Values();

        if (p_resample) {
            variantValues = mkfData.UTILS.Resample(variantValues, mkfData.IDS.GLYPH_RESAMPLE_IDS, this._scaleFactor, true);
            transforms = mkfData.UTILS.Resample(transforms, mkfData.IDS.TR_RESAMPLE_IDS, this._scaleFactor, true);
        }

        if (targetGlyph.isNull) {

            this._emitter.Do(mkfActions.GlyphCreate, {
                family: p_family,
                unicode: p_sourceGlyph.unicode,
                variantValues: variantValues,
                transforms: transforms
            });

            targetVariant = p_family.GetGlyph(unicodeInfos.u).activeVariant;

            SHARED_OPS.CopyLayers(targetVariant, sourceVariant);

        } else {
            /*
            this._emitter.Do(mkfActions.SetPropertyMultiple, {
                target: glyph,
                values: p_data.glyphValues
            });
            */
            this._emitter.Do(mkfActions.SetPropertyMultiple, {
                target: targetVariant,
                values: variantValues
            });
            this._emitter.Do(mkfActions.SetPropertyMultiple, {
                target: targetVariant.transformSettings,
                values: transforms
            });

            SHARED_OPS.RemoveLayers(this._emitter, targetVariant);
            SHARED_OPS.AddLayers(this._emitter, targetVariant, sourceVariant, this._scaleFactor, false);

        }

    }

}

module.exports = CmdGlyphPasteInPlace;