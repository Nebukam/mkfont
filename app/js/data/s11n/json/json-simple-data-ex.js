const nkm = require(`@nkmjs/core`)

/**
 * @description TODO
 * @class
 * @hideconstructor
 * @augments data.core.s11n.json.DataBlock
 * @memberof data.core.s11n
 */
class FamilyDataBlockJSONSerializer extends nkm.data.s11n.json.DataBlock {
    constructor() { super(); }



    /**
     * @description Serialize the data content into the serial object
     * @param {object} p_serial 
     * @param {data.core.DataBlock} p_data 
     * @param {object} [p_options] 
     * @returns 
     */
    static SerializeContent(p_serial, p_data, p_options = null) {
        p_serial[nkm.data.s11n.CTX.JSON.DATA_KEY] = p_data.Values();
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