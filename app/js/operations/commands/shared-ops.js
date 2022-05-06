'use strict';

const UNICODE = require(`../../unicode`);

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
        let layers = [...p_target._layers._array];
        layers.forEach(layer => {
            if (layer._variant) {
                p_editor.Do(mkfActions.LayerRemove, {
                    target: layer
                });
            }
        });
    }

    static AddLayers(p_editor, p_target, p_source, p_scaleFactor = 1, p_expanded = null) {

        p_source._layers._array.forEach(layer => {

            p_editor.Do(mkfActions.LayerAdd, {
                target: p_target,
                layerValues: mkfData.UTILS.Resample(layer.Values(), mkfData.IDS.GLYPH_RESAMPLE_IDS, p_scaleFactor, true),
                expanded: p_expanded == null ? layer.expanded : p_expanded
            });

        });

    }

    static CopyLayers(p_target, p_source, p_scaleFactor = 1) {

        let resample = p_scaleFactor != 1;

        p_source._layers._array.forEach(layerSource => {
            let
                newLayer = nkm.com.Rent(mkfData.GlyphLayer),
                lyrValues = layerSource.Values();

            p_target.AddLayer(newLayer);

            if (resample) {
                mkfData.UTILS.Resample(lyrValues, mkfData.IDS.GLYPH_RESAMPLE_IDS, p_scaleFactor, true);
            }

            newLayer.BatchSet(lyrValues);

        });

    }

    static BoostrapComp(p_editor, p_target, p_uInfos) {

        if (!p_uInfos.comp) { return; }

        let
            maxw = 0,
            hasLayersAlready = !p_target._layers.isEmpty;

        p_uInfos.comp.forEach(c => {
            let ch = UNICODE.GetUnicodeCharacter(Number.parseInt(c, 16));
            if (!this._HasLayer(p_target, ch, `U+${c}`)) {
                p_editor.Do(mkfActions.LayerAdd, {
                    target: p_target,
                    layerValues: { [mkfData.IDS.CHARACTER_NAME]: ch },
                    index: -1,
                    expanded:false
                });
                let g = p_target.glyph.family.GetGlyph(c);
                if (!g.isNull) { maxw = Math.max(maxw, g.activeVariant.Get(mkfData.IDS.EXPORTED_WIDTH)); }
            }
        });

        if (!hasLayersAlready && maxw) {
            p_editor.Do(mkfActions.SetPropertyMultiple, {
                target: p_target,
                values: {
                    [mkfData.IDS.TR_AUTO_WIDTH]: false,
                    [mkfData.IDS.WIDTH]: maxw
                }
            });
        }

    }

    static _HasLayer(p_variant, p_char, p_uni) {
        if (p_variant._layers.isEmpty) { return false; }
        for (let i = 0, n = p_variant._layers.count; i < n; i++) {
            let
                layer = p_variant._layers.At(i),
                cval = layer.Get(mkfData.IDS.CHARACTER_NAME);

            if (cval == p_char || cval == p_uni) { return true; }
        }

        return false;
    }

}

module.exports = SHARED_OPS;