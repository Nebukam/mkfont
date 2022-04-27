'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const mkfData = require(`../../data`);
const svgpath = require('svgpath');

const ActionSetPropertyValue = require(`./action-set-property-value`);

const familyIDs = [
    mkfData.IDS.BASELINE,
    mkfData.IDS.ASCENT,
    mkfData.IDS.DESCENT,
    mkfData.IDS.WIDTH,
    mkfData.IDS.HEIGHT,
    mkfData.IDS.X_HEIGHT,
    mkfData.IDS.CAP_HEIGHT,
];


class ActionSetEM extends ActionSetPropertyValue {
    constructor() { super(); }

    // Expected operation format : { target:SimpleDataBlock, id:`ID`, value:*, resample:bool }

    _UpdateValue(p_target, p_from, p_to) {
        let
            resample = this._operation.resample,
            scaleFactor = p_from / p_to;

        if (resample) {

            // Need to scale all family metrics
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

            let family = p_target;

            for (let s = 0; s < familyIDs.length; s++) {
                let id = familyIDs[s],
                    value = family.Get(id);
                if (value != null) { family.Set(id, value * scaleFactor); }
            }

            let list = family._glyphs.internalArray;

            for (let g = 0, n = list.length; g < n; g++) {

                let variant = list[g].activeVariant,
                    transform = variant._transformSettings,
                    pathData = variant.Get(mkfData.IDS.PATH_DATA);

                if (pathData && !variant.Get(mkfData.IDS.EMPTY)) {
                   // SVGOPS.ScalePathData(pathData, scaleFactor);
                }

                let idList = mkfData.IDS.GLYPH_RESAMPLE_IDS;

                for (let t = 0, tn = idList.length; t < tn; t++) {
                    let id = idList[t],
                        valueObj = variant._values[id];
                    if (!Number.isNaN(valueObj.value)) { variant.Set(id, valueObj.value * scaleFactor); }
                }

                idList = mkfData.IDS.TR_RESAMPLE_IDS;

                for (let t = 0, tn = idList.length; t < tn; t++) {
                    let id = idList[t],
                        value = transform.Get(id);
                    if (value != null) { transform.Set(id, value * scaleFactor); }
                }

            }

        }

    }

}

module.exports = ActionSetEM;