const nkm = require(`@nkmjs/core`)

const UNICODE = require(`../../../unicode`);
const IDS = require(`../../ids`);

const Glyph = require(`../../glyph-data-block`);
const GlyphLayer = require(`../../glyph-layer-data-block`);

const __ID_tr = `transforms`;
const __ID_values = `values`;
const __ID_glyphs = `glyphs`;
const __ID_variants = `variants`;
const __ID_isLigature = `isLiga`;
const __ID_lyrs = `layers`;

/**
 * This is a base implementation. It only add & serialize the known "metadata" property.
 * 
 */

/*
   expected input/ouput :

   {
       ...
       "metadata":{*},
       "data":{*},
       ...
   }
   
*/

/**
 * @description TODO
 * @class
 * @hideconstructor
 * @augments data.core.serialization.json.DataBlock
 * @memberof data.core.serialization
 */
class FamilyDataBlockJSONSerializer extends nkm.data.serialization.json.DataBlock {
    constructor() { super(); }

    /**
     * @description Serialize the data content into the serial object
     * @param {object} p_serial 
     * @param {data.core.DataBlock} p_data 
     * @param {object} [p_options] 
     * @returns 
     */
    static SerializeContent(p_serial, p_data, p_options = null) {
        let fontObj = {};

        let refValueIds = p_data.refGlyph.activeVariant._transformSettings._values;

        fontObj[__ID_values] = p_data.Values();
        fontObj[__ID_tr] = p_data._transformSettings.Values(refValueIds);

        // Glyphs
        let glyphs = [];
        fontObj[__ID_glyphs] = glyphs;

        // First, go through all glyphs
        for (let i = 0; i < p_data._glyphs.count; i++) {

            let
                glyph = p_data._glyphs.At(i),
                variants = [],
                glyphObj = {
                    [__ID_values]: glyph.Values(),
                    [__ID_variants]: variants
                };

            if (glyph.isLigature) {
                glyphObj[__ID_isLigature] = true;
            }

            // Order of variant is the same as subFamilies.
            // Note : make sure to unserialize the first variant to the default variant instance
            // instead of creating a new one
            for (let v = 0; v < glyph.variantsCount; v++) {
                let
                    variant = glyph.GetVariant(v),
                    variantObj = {
                        [__ID_values]: variant.Values(),
                        [__ID_tr]: variant._transformSettings.Values()
                    };

                if (!variant._layers.isEmpty) {
                    let layers = [];
                    variantObj[__ID_lyrs] = layers;
                    variant._layers.ForEach(lyr => {
                        layers.push({
                            [__ID_values]: lyr.Values()
                        });
                    });
                }

                // cleanup runtime-computed values
                delete variantObj[__ID_values][IDS.PATH];
                delete variantObj[__ID_values][IDS.OUT_OF_BOUNDS];

                variants.push(variantObj);
            }

            glyphs.push(glyphObj);

        }

        p_serial[nkm.data.serialization.CONTEXT.JSON.DATA_KEY] = fontObj;

    }

    /**
     * @description Deserialize the data content.
     * @param {data.core.DataBlock} p_data 
     * @param {object} [p_options] 
     * @returns 
     */
    static DeserializeContent(p_serial, p_data, p_options = null, p_meta = null) {

        // First load family data specifics
        p_data.BatchSet(p_serial[__ID_values]);
        p_data._transformSettings.BatchSet(p_serial[__ID_tr]);

        let
            layeredVariants = [],
            layerInfos = [];


        // Add glyphs
        let glyphs = p_serial[__ID_glyphs];
        for (let i = 0; i < glyphs.length; i++) {
            let
                glyph = nkm.com.Rent(Glyph),
                glyphData = glyphs[i],
                variantsData = glyphData[__ID_variants],
                glyphValues = glyphData[__ID_values];

            let unic = glyphValues[IDS.UNICODE];
            if (unic) {
                if (unic.includes(`+`)) { unic = unic.split(`+`); }
                glyph.unicodeInfos = UNICODE.GetInfos(unic, true);
            }

            glyph.BatchSet(glyphValues);
            p_data.AddGlyph(glyph);

            for (let v = 0; v < variantsData.length; v++) {
                let
                    variant = glyph.GetVariant(v),
                    vData = variantsData[v];

                if (!variant) { variant = glyph.AddVariant(null); }

                variant.BatchSet(vData[__ID_values]);
                variant._transformSettings.BatchSet(vData[__ID_tr]);

                if (__ID_lyrs in vData) {
                    layeredVariants.push(variant);
                    layerInfos.push(vData[__ID_lyrs]);
                }

            }
        }

        // Add layer last, so they can be resolved against existing glyphs

        layeredVariants.forEach((variant, i) => {
            let layers = layerInfos[i];
            layers.forEach(layer => {
                let layerInstance = nkm.com.Rent(GlyphLayer);
                variant.AddLayer(layerInstance);
                layerInstance.BatchSet(layer[__ID_values]);
            });
        });

    }

}

module.exports = FamilyDataBlockJSONSerializer;