'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const mkfData = require(`../../data`);

class ActionSetEM extends nkm.data.ops.actions.SetPropertyValue {
    constructor() { super(); }

    // Expected operation format : { target:SimpleDataBlock, id:`ID`, value:*, resample:bool }

    _UpdateValue(p_target, p_new, p_old) {
        let
            resample = this._operation.resample,
            scaleFactor = p_new / p_old;

        if (resample) {

            let family = p_target;

            family.BatchSet(mkfData.UTILS.Resample(
                family.Values(mkfData.IDS.FAMILY_RESAMPLE_IDS),
                mkfData.IDS.FAMILY_RESAMPLE_IDS,
                scaleFactor), true);

            family._transformSettings.BatchSet(mkfData.UTILS.Resample(
                family._transformSettings.Values(mkfData.IDS.TR_RESAMPLE_IDS),
                mkfData.IDS.TR_RESAMPLE_IDS,
                scaleFactor), true);


            //mkfData.UTILS.ResampleValues(family._values, mkfData.IDS.FAMILY_RESAMPLE_IDS, scaleFactor, true);
            //mkfData.UTILS.ResampleValues(family._transformSettings._values, mkfData.IDS.TR_RESAMPLE_IDS, scaleFactor, true);

            //family.CommitUpdate();
            //family._transformSettings.CommitUpdate();

            family._glyphs._array.forEach(glyph => {
                glyph._variants.ForEach((variant) => {

                    // Glyph values

                    variant.BatchSet(mkfData.UTILS.Resample(
                        variant.Values(mkfData.IDS.GLYPH_RESAMPLE_IDS),
                        mkfData.IDS.GLYPH_RESAMPLE_IDS,
                        scaleFactor), true);


                    //mkfData.UTILS.ResampleValues(variant._values, mkfData.IDS.GLYPH_RESAMPLE_IDS, scaleFactor, true);

                    // Glyph transforms

                    let tr = variant._transformSettings;
                    tr.BatchSet(mkfData.UTILS.Resample(
                        tr.Values(mkfData.IDS.TR_RESAMPLE_IDS),
                        mkfData.IDS.TR_RESAMPLE_IDS,
                        scaleFactor), true);

                    //mkfData.UTILS.ResampleValues(variant._transformSettings._values, mkfData.IDS.TR_RESAMPLE_IDS, scaleFactor, true);

                    // Layers transforms
                    variant._layers.ForEach(layer => {

                        layer.BatchSet(mkfData.UTILS.Resample(
                            layer.Values(mkfData.IDS.LYR_RESAMPLE_IDS),
                            mkfData.IDS.LYR_RESAMPLE_IDS,
                            scaleFactor), true);
                        //mkfData.UTILS.ResampleValues(layer._values, mkfData.IDS.TR_RESAMPLE_IDS, scaleFactor, true);
                        //layer.CommitUpdate();
                    });

                    variant.CommitUpdate();

                });

            });

        }

    }

}

module.exports = ActionSetEM;