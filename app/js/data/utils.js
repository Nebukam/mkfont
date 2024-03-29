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

    static __layerClass = null;

    static FindCommonValues(p_reference, p_dataList, p_dataMember = null, backupList = null) {

        let
            refValues = p_reference._values,
            commonValues = {},
            dataCount = p_dataList.length,
            valCount = 0,
            ignoreCount = 0,
            searchState = 0,
            backup = {};

        if (backupList) { backupList.forEach(id => { backup[id] = refValues[id]; }) }

        for (var v in refValues) { refValues[v] = null; }

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

        if (backupList) {
            backupList.forEach(id => {
                refValues[id] = backup[id];
                delete commonValues[id];
            })
        }

        if (searchState == 2) {
            if (ignoreCount == valCount) { return false; }
            for (var v in commonValues) { refValues[v] = commonValues[v]; }
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

    static Resample(p_values, p_ids, p_scale = 1, p_inPlace = false) {

        let resampled = p_inPlace ? p_values : {};

        if (p_scale == 1) {
            if (!p_inPlace) { for (let id in p_values) { resampled[id] = p_values[id]; } }
            return resampled;
        }

        for (let id in p_values) {
            let val = p_ids.includes(id) ? p_values[id] : null;
            if (val == null) { continue; }
            resampled[id] = val * p_scale;
        }
        return resampled;
    }

    static ResampleValues(p_values, p_ids, p_scale = 1) {
        if (p_scale == 1) { return; }
        p_ids.forEach(id => {
            let obj = p_values[id];
            if (!obj || obj == null) { return; }
            obj *= p_scale;
        });
    }

}

module.exports = UTILS;