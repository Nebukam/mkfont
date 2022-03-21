const nkm = require(`@nkmjs/core`);
const Glyph = require(`../../glyph-data-block`);
const IDS  = require(`../../ids`);



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

        fontObj.values = p_data.ValuesAndOverrides();
        fontObj.transforms = p_data._transformSettings.ValuesAndOverrides();

        // Glyphs
        let glyphs = [];
        fontObj.glyphs = glyphs;

        // First, go through all glyphs
        for (let i = 0; i < p_data._glyphs.count; i++) {

            let
                glyph = p_data._glyphs.At(i),
                variants = [],
                glyphObj = {
                    values: glyph.ValuesAndOverrides(),
                    variants: variants
                };

            // Order of variant is the same as subFamilies.
            // Note : make sure to unserialize the first variant to the default variant instance
            // instead of creating a new one
            for (let v = 0; v < glyph._glyphVariants.count; v++) {
                let
                    variant = glyph.GetVariant(glyph._glyphVariants.At(v)),
                    variantObj = {
                        values: variant.ValuesAndOverrides(),
                        transforms: variant._transformSettings.ValuesAndOverrides()
                    };

                // cleanup runtime-computed values
                delete variantObj.values[IDS.PATH];
                delete variantObj.values[IDS.OUT_OF_BOUNDS];

                variants.push(variantObj);
            }

            glyphs.push(glyphObj);

        }

        let subFamilies = [];
        fontObj.subFamilies = subFamilies;

        for (let i = 0; i < p_data._subFamilies.count; i++) {
            let
                subFamily = p_data._subFamilies.At(i),
                subFamilyObj = {
                    values: subFamily.ValuesAndOverrides(),
                    transforms: subFamily._transformSettings.ValuesAndOverrides()
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

        // Need specific implementation.
        let fontObj = p_serial[nkm.data.serialization.CONTEXT.JSON.DATA_KEY];
        if (fontObj.values) { p_data.BatchSet(fontObj.values, true); }
        if (fontObj.transforms) { p_data._transformSettings.BatchSet(fontObj.transforms, true); }

        // Re-create subFamilies first
        if (fontObj.subFamilies) {
            let subFamilies = [];
            for (let i = 0; i < fontObj.subFamilies.length; i++) {
                let
                    subFam = null,
                    subFamObj = fontObj.subFamilies[i];

                if (i == 0) {
                    // Default subFamily
                    subFam = p_data.defaultSubFamily;
                } else {
                    // Additional subFamily, needs to be created.
                    throw new Error(`not implemented`);
                }

                if (subFamObj.values) { subFam.BatchSet(subFamObj.values); }
                if (subFamObj.transforms) { subFam._transformSettings.BatchSet(subFamObj.transforms); }
                subFamilies.push(subFam);
            }

            if (fontObj.glyphs) {
                for (let i = 0; i < fontObj.glyphs.length; i++) {
                    let
                        glyph = new Glyph(),
                        glyphObj = fontObj.glyphs[i],
                        variants = glyphObj.variants;

                    if (glyphObj.values) { glyph.BatchSet(glyphObj.values); }

                    p_data.AddGlyph(glyph);

                    for (let v = 0; v < variants.length; v++) {
                        let variant = null,
                            variantObj = variants[v];

                        variant = glyph.GetVariant(subFamilies[v]);

                        if (glyphObj.values) { variant.BatchSet(variantObj.values); }
                        if (glyphObj.transforms) { variant._transformSettings.BatchSet(variantObj.transforms); }
                        
                    }
                }
            }

        } else {

        }

    }

}

module.exports = FamilyDataBlockJSONSerializer;