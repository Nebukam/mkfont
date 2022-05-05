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

    static FindCommonValues(p_reference, p_dataList, p_dataMember = null, backupList = null) {


        let
            refValues = p_reference._values,
            commonValues = {},
            dataCount = p_dataList.length,
            valCount = 0,
            ignoreCount = 0,
            searchState = 0,
            backup = {};

        if (backupList) { backupList.forEach(id => { backup[id] = refValues[id].value; }) }

        for (var v in refValues) { refValues[v].value = null; }

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
                refValues[id].value = backup[id];
                delete commonValues[id];
            })
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

    static FindCommonLayersValues(p_reference, p_dataList, p_includeAll = false) {

        p_reference._ClearLayers();

        let
            layerIds = {},
            vCount = p_dataList.length,
            layerMap = new Map();
        // Organize layer by names & count

        p_dataList.forEach(variant => {

            variant._layers.ForEach(layer => {

                let
                    id = layer.Get(IDS.CHARACTER_NAME) || `____null___`,
                    obj = layerIds[id];

                if (!obj) { obj = { count: 0, layers: [], nfos: layer._glyphInfos }; layerIds[id] = obj; }

                obj.count += 1;
                obj.layers.push(layer);

                if (layer.expanded) { obj.expanded = true; }

            });

        });

        for (var lid in layerIds) {
            let obj = layerIds[lid];
            if ((p_includeAll || obj.count == vCount) && obj.count >= 2) {
                let newLayer = nkm.com.Rent(this.__layerClass);
                p_reference.AddLayer(newLayer);
                newLayer.expanded = obj.expanded;
                newLayer._useCount = obj.layers.length;
                newLayer._glyphInfos = obj.nfos;
                this.FindCommonValues(newLayer, obj.layers);
                layerMap.set(newLayer, obj.layers);
            }
        }

        return layerMap;

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
            if (!obj || obj.value == null) { return; }
            obj.value *= p_scale;
        });
    }

}

module.exports = UTILS;