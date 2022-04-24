'use strict';

const UNICODE = require(`../unicode`);
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

        if (result != null) { return result; }

        if (p_fallbacks.length > 0) {
            p_self = p_fallbacks.shift();
            return this.Resolve(p_id, p_self, ...p_fallbacks);
        }

        return null;

    }

    static FindCommonValues(p_reference, p_dataList, p_dataMember = null) {

        let
            refValues = p_reference._values,
            commonValues = {},
            dataCount = p_dataList.length,
            valCount = 0,
            ignoreCount = 0,
            searchState = 0;

        for (var v in refValues) {
            refValues[v].value = null;
        }

        compareloop: for (let i = 0; i < dataCount; i++) {

            let data = p_dataList[i];
            if (p_dataMember) { data = data[p_dataMember]; }

            if (searchState == 0) {
                // Establish baseline values
                for (var v in refValues) {
                    commonValues[v] = data.Get(v);
                    valCount++;
                }
                searchState = 1;
            } else {
                // Reach comparison
                searchState = 2;
                for (var v in commonValues) {

                    let
                        gVal = data.Get(v),
                        cVal = commonValues[v];

                    if (gVal == null || gVal == cVal) {
                        // Equals baseline, keep going
                        continue;
                    } else {
                        // Mismatch, delete value from common
                        delete commonValues[v];
                        ignoreCount++;
                        if (ignoreCount == valCount) { break compareloop; }
                    }
                }
            }
        }

        if (searchState == 2) {
            if (ignoreCount == valCount) { return false; }

            for (var v in commonValues) {
                refValues[v].value = commonValues[v];
            }

            return true;
        }
        return false;

    }

    static FindFirstEmptyIndex(p_family, p_start = 0) {

        let
            glyph = p_family.GetGlyph(p_start.toString(16).padStart(4, `0`)),
            index = p_start;

        while (!glyph.isNull) {
            glyph = p_family.GetGlyph(index.toString(16).padStart(4, `0`));
            index++;
        }

        return index;

    }

}

module.exports = UTILS;