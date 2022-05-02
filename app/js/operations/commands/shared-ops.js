'use strict';

const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

/**
 * @description TODO
 * @class
 * @hideconstructor
 * @memberof data.core
 */
class SHARED_OPS {
    constructor() { }

    static RemoveLayers(p_editor, p_target) {
        p_target._layers.ForEach(layer => {

            p_editor.Do(mkfActions.LayerRemove, {
                target: layer
            });

        });
    }

    static AddLayers(p_editor, p_target, p_source, p_scaleFactor = 1) {

        p_source._layers._array.forEach(layer => {

            p_editor.Do(mkfActions.LayerAdd, {
                target: p_target,
                layerValues: mkfData.UTILS.Resample(layer.Values(), mkfData.IDS.GLYPH_RESAMPLE_IDS, p_scaleFactor, true),
                transforms: mkfData.UTILS.Resample(layer._transformSettings.Values(), mkfData.IDS.TR_RESAMPLE_IDS, p_scaleFactor, true),
            });

        });

    }

    static CopyLayers(p_target, p_source, p_scaleFactor = 1) {

        let resample = p_scaleFactor != 1;

        p_source._layers._array.forEach(layerSource => {
            let
                newLayer = nkm.com.Rent(mkfData.GlyphLayer),
                lyrValues = layerSource.Values(),
                lyrTransforms = layerSource._transformSettings.Values();

            p_target.AddLayer(newLayer);

            if (resample) {
                mkfData.UTILS.Resample(lyrValues, mkfData.IDS.GLYPH_RESAMPLE_IDS, p_scaleFactor, true);
                mkfData.UTILS.Resample(lyrTransforms, mkfData.IDS.TR_RESAMPLE_IDS, p_scaleFactor, true);
            }

            newLayer.BatchSet(lyrValues);
            newLayer._transformSettings.BatchSet(lyrTransforms);


        });

    }

}

module.exports = SHARED_OPS;