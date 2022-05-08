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

class CmdGlyphPaste extends actions.Command {
    constructor() { super(); }

    _InternalExecute() {

        let
            family = this._emitter.data,
            variant = family.GetGlyph(this._context?.u || this._emitter.inspectedData.lastItem?.u).activeVariant,
            svgStats = { exists: false },
            svgString = clipboard.readText();

        try {
            svgStats = SVGOPS.SVGStats(svgString);
        } catch (e) { console.log(e); }

        //console.log(svgStats);

        if (!svgStats.exists) {
            /*
            nkm.dialog.Push({
                title: `Invalid content`,
                message: `Couldn't find how to use the selected file :()`,
                actions: [{ label: `Okay` }],
                origin: this, flavor: nkm.com.FLAGS.WARNING
            });
            */
            this._Cancel();
            return;
        }

        let
            glyph = variant.glyph,
            mkfValues = SVGOPS.TryGetMKFValues(svgString, variant),
            cachedTextMatch = globalThis.__copySourceString && globalThis.__copySourceString == svgString ? true : false,
            scaleFactor = globalThis.__copySourceEM ? family.Get(mkfData.IDS.EM_UNITS) / globalThis.__copySourceEM : 1,
            layers = null,
            unicodeInfos;

        if (!cachedTextMatch) {
            globalThis.__copySourceString = null;
            globalThis.__copySourceVariant = null;
        } else if (globalThis.__copySourceVariant) {

            if (globalThis.__copySourceVariant == variant) {
                //pasting glyph onto itself
                this._Cancel();
                return;
            }

            if (globalThis.__copySourceVariant.glyph.isNull) {
                globalThis.__copySourceVariant = null;
            } else if (!globalThis.__copySourceVariant._layers.isEmpty) {
                layers = globalThis.__copySourceVariant._layers._array;
            }
        }



        delete mkfValues.variantValues[mkfData.IDS.PATH];

        mkfData.UTILS.Resample(mkfValues.transforms, mkfData.IDS.TR_RESAMPLE_IDS, scaleFactor, true);
        mkfData.UTILS.Resample(mkfValues.variantValues, mkfData.IDS.GLYPH_RESAMPLE_IDS, scaleFactor, true);

        if (glyph.isNull) {
            // Need to create a new glyph!

            unicodeInfos = glyph.unicodeInfos;
            this._emitter.Do(mkfActions.GlyphCreate, {
                family: family,
                unicode: unicodeInfos,
                path: svgStats,
                transforms: mkfValues.hasTransforms ? mkfValues.transforms : null,
                variantValues: mkfValues.hasVariantValues ? mkfValues.variantValues : null
            });

            if (layers) {
                let variant = family.GetGlyph(unicodeInfos.u).activeVariant;
                SHARED_OPS.PasteLayers(variant, globalThis.__copySourceVariant, scaleFactor);
            }

        } else {

            this._emitter.StartActionGroup({
                icon: `clipboard-read`,
                name: `Pasted glyph`,
                title: `Pasted an glyph with its transforms`
            });

            this._emitter.Do(mkfActions.SetProperty,
                { target: variant, id: mkfData.IDS.PATH_DATA, value: svgStats }
            );

            if (mkfValues.hasTransforms) {
                this._emitter.Do(mkfActions.SetPropertyMultiple,
                    { target: variant.transformSettings, values: mkfValues.transforms }
                );
            }

            this._emitter.Do(mkfActions.SetPropertyMultiple, {
                target: variant,
                values: {
                    ...mkfValues.variantValues,
                    [mkfData.IDS.PATH_DATA]: svgStats
                }
            });

            if (layers) {
                SHARED_OPS.RemoveLayers(this._emitter, variant);
                SHARED_OPS.AddLayers(this._emitter, variant, globalThis.__copySourceVariant, this._scaleFactor);
            }

            this._emitter.EndActionGroup();

        }

        glyph.CommitUpdate();
        this._Success();

    }

}

module.exports = CmdGlyphPaste;