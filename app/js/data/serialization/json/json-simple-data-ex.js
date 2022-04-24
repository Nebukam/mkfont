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
        p_serial[nkm.data.serialization.CONTEXT.JSON.DATA_KEY] = p_data.Values();
    }

    /**
     * @description Deserialize the data content.
     * @param {data.core.DataBlock} p_data 
     * @param {object} [p_options] 
     * @returns 
     */
    static DeserializeContent(p_serial, p_data, p_options = null, p_meta = null) {
        p_data.BatchSet(p_serial);
    }

}

module.exports = FamilyDataBlockJSONSerializer;