const nkm = require(`@nkmjs/core`)

const UNICODE = require(`../../../unicode`);
const IDS = require(`../../ids`);

const Glyph = require(`../../glyph-data-block`);
const SubFamily = require(`../../sub-family-data-block`);

const __ID_tr = `transforms`;
const __ID_values = `values`;
const __ID_glyphs = `glyphs`;
const __ID_variants = `variants`;
const __ID_isLigature = `isLiga`;
const __ID_subFamilies = `subFamilies`;

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

        let refValueIds = p_data.refGlyph.defaultGlyph._transformSettings._values;

        fontObj[__ID_values] = p_data.ValuesAndOverrides();
        fontObj[__ID_tr] = p_data._transformSettings.ValuesAndOverrides(refValueIds);

        // Glyphs
        let glyphs = [];
        fontObj[__ID_glyphs] = glyphs;

        // First, go through all glyphs
        for (let i = 0; i < p_data._glyphs.count; i++) {

            let
                glyph = p_data._glyphs.At(i),
                variants = [],
                glyphObj = {
                    [__ID_values]: glyph.ValuesAndOverrides(),
                    [__ID_variants]: variants
                };

            if (glyph.isLigature) {
                glyphObj[__ID_isLigature] = true;
            }

            // Order of variant is the same as subFamilies.
            // Note : make sure to unserialize the first variant to the default variant instance
            // instead of creating a new one
            for (let v = 0; v < glyph._glyphVariants.count; v++) {
                let
                    variant = glyph.GetVariant(glyph._glyphVariants.At(v)),
                    variantObj = {
                        [__ID_values]: variant.ValuesAndOverrides(),
                        [__ID_tr]: variant._transformSettings.ValuesAndOverrides()
                    };

                // cleanup runtime-computed values
                delete variantObj[__ID_values][IDS.PATH];
                delete variantObj[__ID_values][IDS.OUT_OF_BOUNDS];

                variants.push(variantObj);
            }

            glyphs.push(glyphObj);

        }

        let subFamilies = [];
        fontObj[__ID_subFamilies] = subFamilies;

        for (let i = 0; i < p_data._subFamilies.count; i++) {
            let
                subFamily = p_data._subFamilies.At(i),
                subFamilyObj = {
                    [__ID_values]: subFamily.ValuesAndOverrides(),
                    [__ID_tr]: subFamily._transformSettings.ValuesAndOverrides(refValueIds)
                };

            subFamilies.push(subFamilyObj);
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
        p_data.BatchSetWithOverrides(p_serial[__ID_values]);
        p_data._transformSettings.BatchSetWithOverrides(p_serial[__ID_tr]);

        // Add subfamilies
        let subFamilies = p_serial[__ID_subFamilies],
            sfInstances = [];

        for (let i = 0; i < subFamilies.length; i++) {
            let sf, sfData = subFamilies[i];
            if (i == 0) {
                sf = p_data.defaultSubFamily;
            } else {
                sf = nkm.com.Rent(SubFamily);
                p_data.AddSubFamily(sf);
            }

            sfInstances.push(sf);
            sf.BatchSetWithOverrides(sfData[__ID_values]);
            sf._transformSettings.BatchSetWithOverrides(sfData[__ID_tr]);

        }

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

            glyph.BatchSetWithOverrides(glyphValues);
            p_data.AddGlyph(glyph);

            for (let s = 0; s < sfInstances.length; s++) {
                let variant = glyph.GetVariant(sfInstances[s]), vData = variantsData[s];
                variant.BatchSetWithOverrides(vData[__ID_values]);
                variant._transformSettings.BatchSetWithOverrides(vData[__ID_tr]);
            }
        }

    }

}

module.exports = FamilyDataBlockJSONSerializer;