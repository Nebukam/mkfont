'use strict';

const IDS = require(`./ids`);
const IDS_EXT = require(`./ids-ext`);
/**
 * @description TODO
 * @class
 * @hideconstructor
 * @memberof data.core
 */
class UTILS {
    constructor() { }

    static Resolve(p_id, p_self, ...p_fallbacks) {

        if (!p_self) { return null; }

        //console.log(`Resolve ${p_id} in ${p_self} -> ${p_fallbacks}`);
        let valueObj = p_self._values[p_id];
        let result = valueObj ? valueObj.value : null;

        // TODO : If valueObj.override = true, attempt to return local value
        // TODO : If valueObj.override = false, skip local value and go straight to inherited one

        if (result != null) {
            if (`override` in valueObj) {
                if (valueObj.override) { return result; }
            } else { return result; }
        }

        if (p_fallbacks.length > 0) {
            p_self = p_fallbacks.shift();
            return this.Resolve(p_id, p_self, ...p_fallbacks);
        }

        return null;

    }

    static GetRangeInfos(p_family, p_value){

        let results = {
            indexOffset:0,
            indexCount:0,
            list:null,
            type:null
        };

        if (`includes` in p_value) {
            // Expect an mixed array of indices & [a,b] ranges
            results.indexOffset = p_value.imin;
            results.indexCount = p_value.count;
            results.list = p_value.includes;
            results.type = IDS_EXT.RANGE_MIXED;

        } else if (`start` in p_value) {
            // Block with a count & start index
            results.indexOffset = p_value.start;
            results.indexCount = p_value.count;
            results.type = IDS_EXT.RANGE_INLINE;

        } else if (`fetchList` in p_value) {
            // Single array of unicode string, likely ligatures.
            results.list = p_value.fetchList(p_family);
            results.indexOffset = 0;
            results.indexCount = results.list.length;
            results.type = IDS_EXT.RANGE_PLAIN;
        }

        return results;

    }

    static GetFamilyUArray(p_family) {
        return p_family._glyphUnicodeCache;
    }

    static GetFamilyLigaUArray(p_family) {
        let result = [];
        p_family._glyphs.ForEach(
            (item, index) => {
                if (p_family._ligatureSet.has(item)) { result.push(item.Get(IDS.UNICODE)); }
            });
            console.log(result);
        return result;
    }

    static GetFamilyComponents(p_family) {
        return [];
    }

    static GetSearchResultsArray(p_family){
        return [];
    }

}

module.exports = UTILS;