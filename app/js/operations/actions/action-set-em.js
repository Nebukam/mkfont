'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const mkfData = require(`../../data`);
const svgpath = require('svgpath');

const ActionSetPropertyValue = require(`./action-set-property-value`);

const subFamilyIDs = [
    mkfData.IDS.BASELINE,
    mkfData.IDS.ASCENT,
    mkfData.IDS.DESCENT,
    mkfData.IDS.WIDTH,
    mkfData.IDS.HEIGHT,
    mkfData.IDS.X_HEIGHT,
    mkfData.IDS.CAP_HEIGHT,
];

const transformIDs = [
    mkfData.IDS.TR_WIDTH_SHIFT,
    mkfData.IDS.TR_WIDTH_PUSH,
    mkfData.IDS.TR_SCALE_FACTOR
];

const glyphsIDs = [
    mkfData.IDS.WIDTH,
    mkfData.IDS.HEIGHT
];

class ActionSetEM extends ActionSetPropertyValue {
    constructor() { super(); }

    // Expected operation format : { target:SimpleDataBlock, id:`ID`, value:*, resample:bool }

    _UpdateValue(p_target, p_from, p_to) {
        let
            resample = this._operation.resample,
            scaleFactor = p_from / p_to;

        if (resample) {

            // Need to scale all subFamily metrics
            // - Ascent
            // - Descent
            // - Height
            // - Width
            // - Height
            // Need to scale all glyph metrics
            // - Width (even thought it's computed)
            // - Shift
            // - Push
            // - Manual scale factor if any

            let subFamily = p_target;

            for (let s = 0; s < subFamilyIDs.length; s++) {
                let id = subFamilyIDs[s],
                    value = subFamily.Get(id);
                if (value != null) { subFamily.Set(id, value * scaleFactor); }
            }

            let
                list = subFamily.family._glyphs.internalArray,
                tn = transformIDs.length,
                gn = glyphsIDs.length;

            for (let g = 0, n = list.length; g < n; g++) {

                let variant = list[g].GetVariant(subFamily),
                    transform = variant._transformSettings,
                    pathData = variant.Get(mkfData.IDS.PATH_DATA);

                if (pathData && !variant.Get(mkfData.IDS.EMPTY)) {
                    SVGOPS.ScalePathData(pathData, scaleFactor);
                }

                for (let t = 0; t < gn; t++) {
                    let id = glyphsIDs[t],
                        valueObj = variant._values[id];
                    if (!(`override` in valueObj) || valueObj.override) { variant.Set(id, valueObj.value * scaleFactor); }
                }

                for (let t = 0; t < tn; t++) {
                    let id = transformIDs[t],
                        value = transform.Get(id);
                    if (value != null) { transform.Set(id, value * scaleFactor); }
                }

            }

        }

    }

}

module.exports = ActionSetEM;