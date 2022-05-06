'use strict';

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
            scaleFactor = globalThis.__copySourceEM ? family.Get(mkfData.IDS.EM_UNITS) / globalThis.__copySourceEM : 1,
            unicodeInfos;

        if (!mkfValues.hasTransforms && !mkfValues.hasVariantValues) {
            this._Cancel();
            return;
        }

        delete mkfValues.variantValues[mkfData.IDS.PATH];

        mkfData.UTILS.Resample(mkfValues.transforms, mkfData.IDS.TR_RESAMPLE_IDS, scaleFactor, true);
        mkfData.UTILS.Resample(mkfValues.variantValues, mkfData.IDS.GLYPH_RESAMPLE_IDS, scaleFactor, true);

        this._emitter.StartActionGroup({
            icon: `clipboard-read`,
            name: `Pasted transforms`,
            title: `Pasted transforms onto existing glyphs within active selection`
        });

        if (nkm.u.isInstanceOf(this._context, mkfData.GlyphVariant)) {

            let glyph = this._context.glyph;
            if (glyph.isNull) {
                this._Cancel();
                return;
            }

            if (mkfValues.hasTransforms) {
                this._emitter.Do(mkfActions.SetPropertyMultiple,
                    { target: this._context.transformSettings, values: mkfValues.transforms }
                );
            }
            if (mkfValues.hasVariantValues) {
                this._emitter.Do(mkfActions.SetPropertyMultiple,
                    { target: this._context, values: mkfValues.variantValues }
                );
            }

        } else {
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
        }



        this._emitter.EndActionGroup();

        this._Success();

    }

}

module.exports = CmdGlyphPasteTransform;