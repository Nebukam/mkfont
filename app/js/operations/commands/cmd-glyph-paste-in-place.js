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

        this._emitter.StartActionGroup({
            icon: `clipboard-read`,
            name: `Paste in place`,
            title: `Pasted glyphs from an mkfont to another`
        });

        for (let i = 0; i < globalThis.__mkfGlyphCopies.length; i++) {
            this.PasteInPlace(family, globalThis.__mkfGlyphCopies[i]);
        }

        this._emitter.EndActionGroup();

        this._Success();

    }

    PasteInPlace(p_family, p_data) {

        let
            unicodeInfos = p_data.unicode,
            glyph = p_family.GetGlyph(unicodeInfos.u);

        if (glyph.isNull) {

            this._emitter.Do(mkfActions.CreateGlyph, {
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