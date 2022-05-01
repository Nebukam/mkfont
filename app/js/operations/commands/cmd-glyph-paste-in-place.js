//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdGlyphPasteInPlace extends actions.Command {
    constructor() { super(); }

    _InternalExecute() {

        let family = this._emitter.data;

        if (!globalThis.__mkfGlyphCopies ||
            globalThis.__mkfGlyphCopies.length == 0) {
            this._Cancel();
            return;
        }

        this._scaleFactor = family.Get(mkfData.IDS.EM_UNITS) / globalThis.__mkfGlyphCopiesEM;

        let resample = (this._scaleFactor != 1);

        this._emitter.StartActionGroup({
            icon: `clipboard-read`,
            name: `Paste in place`,
            title: `Pasted glyphs from an mkfont to another`
        });

        for (let i = 0; i < globalThis.__mkfGlyphCopies.length; i++) {
            this.PasteInPlace(family, globalThis.__mkfGlyphCopies[i], resample);
        }

        this._emitter.EndActionGroup();

        this._Success();

    }

    PasteInPlace(p_family, p_data, p_resample = false) {

        let
            unicodeInfos = p_data.unicode,
            glyph = p_family.GetGlyph(unicodeInfos.u);

        if (p_resample) {

            let idList = mkfData.IDS.GLYPH_RESAMPLE_IDS;

            for (let i = 0; i < idList.length; i++) {
                let
                    id = idList[i],
                    value = p_data.variantValues[id];

                if (value != undefined && value != null) { p_data.variantValues[id] = value * this._scaleFactor; }

            }

            idList = mkfData.IDS.TR_RESAMPLE_IDS;

            for (let i = 0; i < idList.length; i++) {
                let
                    id = idList[i],
                    value = p_data.transforms[id];

                if (value != undefined && value != null) { p_data.transforms[id] = value * this._scaleFactor; }
            }

        }

        if (glyph.isNull) {

            this._emitter.Do(mkfActions.GlyphCreate, {
                family: p_family,
                unicode: p_data.unicode,
                //glyphValues: p_data.glyphValues,
                variantValues: p_data.variantValues,
                transforms: p_data.transforms
            });

        } else {
            /*
            this._emitter.Do(mkfActions.SetPropertyMultiple, {
                target: glyph,
                values: p_data.glyphValues
            });
            */
            this._emitter.Do(mkfActions.SetPropertyMultiple, {
                target: glyph.activeVariant,
                values: p_data.variantValues
            });
            this._emitter.Do(mkfActions.SetPropertyMultiple, {
                target: glyph.activeVariant.transformSettings,
                values: p_data.transforms
            });

        }

    }

}

module.exports = CmdGlyphPasteInPlace;