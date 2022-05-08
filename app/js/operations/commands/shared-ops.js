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
            if (p_target.availSlots <= 0) { return; }
            p_editor.Do(mkfActions.LayerAdd, {
                target: p_target,
                layerValues: mkfData.UTILS.Resample(layer.Values(), mkfData.IDS.LYR_RESAMPLE_IDS, p_scaleFactor, true),
                expanded: p_expanded == null ? layer.expanded : p_expanded
            });

        });

    }

    static AddLayersFromNameList(p_editor, p_target, p_nameList) {
        if (!p_nameList) { return; }
        p_nameList.forEach(name => {
            if (p_target.availSlots <= 0) { return; }
            let resolvedChar = UNICODE.ResolveString(name);
            if (p_target.HasLayer(resolvedChar)) { return; }
            p_editor.Do(mkfActions.LayerAdd, {
                target: p_target,
                layerValues: { [mkfData.IDS.LYR_CHARACTER_NAME]: resolvedChar },
                expanded: false
            });
        });
    }


    static PasteLayers(p_target, p_source, p_scaleFactor = 1) {

        let resample = p_scaleFactor != 1;

        p_source._layers._array.forEach(layerSource => {

            if (p_target.availSlots <= 0) { return; }

            let
                newLayer = nkm.com.Rent(mkfData.GlyphLayer),
                lyrValues = layerSource.Values();

            p_target.AddLayer(newLayer);

            if (resample) {
                mkfData.UTILS.Resample(lyrValues, mkfData.IDS.LYR_RESAMPLE_IDS, p_scaleFactor, true);
            }

            newLayer.BatchSet(lyrValues);

        });

    }

    static PasteLayersTransforms(p_editor, p_target, p_source, p_scaleFactor = 1) {

        let resample = p_scaleFactor != 1;

        p_source._layers._array.forEach(layerSource => {

            if (p_target.availSlots <= 0) { return; }

            let srcId = layerSource.Get(mkfData.IDS.LYR_CHARACTER_NAME);

            p_target._layers.ForEach(layerTarget => {
                if (layerTarget.Get(mkfData.IDS.LYR_CHARACTER_NAME) == srcId) {
                    let lyrValues = layerSource.Values();
                    if (resample) { mkfData.UTILS.Resample(lyrValues, mkfData.IDS.LYR_RESAMPLE_IDS, p_scaleFactor, true); }
                    p_editor.Do(mkfActions.SetPropertyMultiple, {
                        target: layerTarget,
                        values: lyrValues
                    });
                }
            });

        });

    }

    static BoostrapComp(p_editor, p_target, p_uInfos) {

        if (!p_uInfos.comp) { return; }

        let
            maxw = 0,
            hasLayersAlready = !p_target._layers.isEmpty;

        p_uInfos.comp.forEach((c, i) => {

            if (p_target.availSlots <= 0) { return; }

            let ch = UNICODE.GetUnicodeCharacter(Number.parseInt(c, 16));
            if (!p_target.HasLayer(ch, `U+${c}`)) {
                p_editor.Do(mkfActions.LayerAdd, {
                    target: p_target,
                    layerValues: {
                        [mkfData.IDS.LYR_CHARACTER_NAME]: ch,
                        [mkfData.IDS.LYR_IS_CONTROL_LAYER]: hasLayersAlready ? false : (i == 0) ? true : false
                    },
                    index: -1,
                    expanded: false,
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

    static GetGlyphListDependencies(p_sources, p_destFamily) {
        let result = [];
        p_sources.forEach(g => {
            this.GetGlyphDependencies(g, result, p_sources, p_destFamily);
        });
        return result;
    }

    static GetGlyphDependencies(p_glyph, p_pool, p_exclude, p_destFamily) {
        if (p_glyph.isNull) { return; }
        p_glyph.activeVariant._layers.ForEach(layer => {
            if (layer._glyphInfos && layer.importedVariant) {
                let g = layer.importedVariant.glyph;
                if (!g.isNull && !p_exclude.includes(g)) {
                    let destGlyph = p_destFamily.GetGlyph(layer._glyphInfos.u);
                    if (destGlyph.isNull) {
                        if (!p_pool.includes(g)) {
                            p_pool.push(g);
                            this.GetGlyphDependencies(g, p_pool, p_exclude, p_destFamily);
                        }
                    }
                }
            }
        });
    }

}

module.exports = SHARED_OPS;