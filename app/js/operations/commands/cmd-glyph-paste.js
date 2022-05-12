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

const __groupInfos = {
    icon: `clipboard-read`,
    name: `Pasted glyph`,
    title: `Pasted an glyph with its transforms`
};

class CmdGlyphPaste extends actions.Command {
    constructor() { super(); }

    _InternalExecute() {

        let svgString = clipboard.readText();

        if (svgString == SHARED_OPS.copiedString) {

            // Clipboard still have the same reference string : pasting from inside MkFont

            this._emitter.StartActionGroup(__groupInfos);

            let success = SHARED_OPS.PasteTo(this._emitter, SHARED_OPS.MODE_DEFAULT);

            this._emitter.EndActionGroup();

            return success ? this._Success() : this._Fail();

        }

        let
            family = this._emitter.data,
            variant = family.GetGlyph(this._context?.u || this._emitter.inspectedData.lastItem?.u).activeVariant,
            svgStats = { exists: false };

        try { svgStats = SVGOPS.SVGStats(svgString, mkfData.INFOS.MARK_COLOR); }
        catch (e) { console.log(e); }

        if (!svgStats.exists) { return this._Fail(); }

        let
            glyph = variant.glyph,
            mkfValues = SVGOPS.TryGetMKFValues(svgString, variant);

        delete mkfValues.variantValues[mkfData.IDS.PATH];

        this._emitter.StartActionGroup(__groupInfos);

        if (glyph.isNull) {

            // Need to create a new glyph

            let createOp = {
                family: family,
                unicode: glyph.unicodeInfos,
                path: svgStats,
            };

            if (mkfValues.hasTransforms) { createOp.transforms = mkfValues.transforms; }
            if (mkfValues.hasVariantValues) { createOp.variantValues = mkfValues.variantValues; }

            this._emitter.Do(mkfActions.GlyphCreate, createOp);

            if (svgStats.layers) {
                SHARED_OPS.AddLayersFromNameList(this._emitter, variant, svgStats.layers);
            }

        } else {

            // Modify existing glyph

            if (mkfValues.hasTransforms) {
                this._emitter.Do(mkfActions.SetPropertyMultiple,
                    { target: variant._transformSettings, values: mkfValues.transforms }
                );
            }

            this._emitter.Do(mkfActions.SetPropertyMultiple, {
                target: variant,
                values: {
                    ...mkfValues.variantValues,
                    [mkfData.IDS.PATH_DATA]: svgStats
                }
            });

            if (svgStats.layers) {
                SHARED_OPS.AddLayersFromNameList(this._emitter, variant, svgStats.layers);
            }

        }

        this._emitter.EndActionGroup();

        glyph.CommitUpdate();
        this._Success();

    }

}

module.exports = CmdGlyphPaste;