//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

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
            unicodeInfos;

        delete mkfValues.variantValues[mkfData.IDS.PATH];

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
            if (mkfValues.hasVariantValues) {
                this._emitter.Do(mkfActions.SetPropertyMultiple,
                    { target: variant, values: mkfValues.variantValues }
                );
            }

            this._emitter.EndActionGroup();

        }

        glyph.CommitUpdate();
        this._Success();

    }

}

module.exports = CmdGlyphPaste;