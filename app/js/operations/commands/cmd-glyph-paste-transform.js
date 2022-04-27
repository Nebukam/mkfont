//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdGlyphPasteTransform extends actions.Command {
    constructor() { super(); }

    _InternalExecute() {

        let
            family = this._emitter.data,
            infoList = this._emitter.inspectedData.stack._array,
            mkfValues = SVGOPS.TryGetMKFValues(clipboard.readText(), family.refGlyph.activeVariant),
            unicodeInfos;

        if (!mkfValues.hasTransforms && !mkfValues.hasVariantValues) {
            this._Cancel();
            return;
        }

        delete mkfValues.variantValues[mkfData.IDS.PATH];

        this._emitter.StartActionGroup({
            icon: `clipboard-read`,
            name: `Pasted transforms`,
            title: `Pasted transforms onto existing glyphs within active selection`
        });

        for (let i = 0; i < infoList.length; i++) {
            let glyph = family.GetGlyph(infoList[i].u);
            if (glyph.isNull) { continue; }

            if (mkfValues.hasTransforms) {
                this._emitter.Do(mkfActions.SetPropertyMultiple,
                    { target: glyph.activeVariant.transformSettings, values: mkfValues.transforms }
                );
            }
            if (mkfValues.hasVariantValues) {
                this._emitter.Do(mkfActions.SetPropertyMultiple,
                    { target: glyph.activeVariant, values: mkfValues.variantValues }
                );
            }

        }

        this._emitter.EndActionGroup();

        this._Success();

    }

}

module.exports = CmdGlyphPasteTransform;