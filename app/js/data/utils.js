'use strict';

const IDS = require(`./ids`);

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

    static GetFamilyUArray(p_family) {
        return p_family._glyphUnicodeCache;
    }

    static GetFamilyLigaUArray(p_family) {
        let result = [];
        p_family._glyphs.ForEach(
            (item, index) => {
                if (p_family._ligatureSet.has(item)) { result.push(item.Get(IDS.UNICODE)); }
            });
        return result;
    }

    static GetFamilyComponents(p_family) {
        return [];
    }


}

module.exports = UTILS;