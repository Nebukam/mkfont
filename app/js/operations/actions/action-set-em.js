'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const mkfData = require(`../../data`);
const svgpath = require('svgpath');

const ActionSetPropertyValue = require(`./action-set-property-value`);

const familyIDs = [
    mkfData.IDS.BASELINE,
    mkfData.IDS.ASCENT,
    mkfData.IDS.DESCENT,
    mkfData.IDS.WIDTH,
    mkfData.IDS.HEIGHT,
    mkfData.IDS.X_HEIGHT,
    mkfData.IDS.CAP_HEIGHT,
];


class ActionSetEM extends ActionSetPropertyValue {
    constructor() { super(); }

    // Expected operation format : { target:SimpleDataBlock, id:`ID`, value:*, resample:bool }

    _UpdateValue(p_target, p_from, p_to) {
        let
            resample = this._operation.resample,
            scaleFactor = p_from / p_to;

        if (resample) {

            let family = p_target;

            family.BatchSet(mkfData.UTILS.Resample(
                family.Values(mkfData.IDS.FAMILY_RESAMPLE_IDS),
                mkfData.IDS.FAMILY_RESAMPLE_IDS,
                scaleFactor), true);

            family._glyphs._array.forEach(glyph => {
                glyph._variants.forEach(variant => {

                    // Glyph values
                    variant.BatchSet(mkfData.UTILS.Resample(
                        variant.Values(mkfData.IDS.GLYPH_RESAMPLE_IDS),
                        mkfData.IDS.GLYPH_RESAMPLE_IDS,
                        scaleFactor), true);

                    // Glyph transforms
                    let tr = variant._transformSettings;
                    tr.BatchSet(mkfData.UTILS.Resample(
                        tr.Values(mkfData.IDS.TR_RESAMPLE_IDS),
                        mkfData.IDS.TR_RESAMPLE_IDS,
                        scaleFactor), true);

                    // Layers transforms
                    variant._layers.ForEach(layer => {
                        let ltr = layer._transformSettings;
                        ltr.BatchSet(mkfData.UTILS.Resample(
                            ltr.Values(mkfData.IDS.TR_RESAMPLE_IDS),
                            mkfData.IDS.TR_RESAMPLE_IDS,
                            scaleFactor), true);
                    });


                });
            });

        }

    }

}

module.exports = ActionSetEM;