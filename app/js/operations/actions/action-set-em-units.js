'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const mkfData = require(`../../data`);
const svgpath = require('svgpath');

const ActionSetPropertyValue = require(`./action-set-property-value`);

const subFamilyIDs = [
    mkfData.IDS.ASCENT,
    mkfData.IDS.DESCENT,
    mkfData.IDS.WIDTH,
    mkfData.IDS.HEIGHT,
];

const transformIDs = [
    mkfData.IDS.TR_WIDTH_SHIFT,
    mkfData.IDS.TR_WIDTH_PUSH,
    mkfData.IDS.TR_SCALE_FACTOR
];

class ActionSetEM extends ActionSetPropertyValue {
    constructor() { super(); }

    // Expected operation format : { target:SimpleDataBlock, id:`ID`, value:*, resample:bool }

    _UpdateValue(p_from, p_to) {
        let
            resample = this._operation.resample,
            scaleFactor = p_to / p_from;

        if (resample) {
            
            // Need to scale all subFamily metrics
            // - Ascent
            // - Descent
            // - Height
            // - Width
            // - Height
            // Need to scale all glyph metrics
            // - Shift
            // - Push
            // - Manual scale factor if any

            for (let s = 0; s < subFamilyIDs.length; s++) {
                let id = subFamilyIDs[s];
                value = subFamily.Get(id);
                if (value != null) { subFamily.Set(id, value * scaleFactor); }
            }

            let
                list = subFamily.family._glyphs.internalArray,
                tn = transformIDs.length;

            for (let g = 0, n = list.length; i < n; i++) {

                let transform = list[i].GetVariant(subFamily)._transformSettings;

                for (let t = 0; t < tn; t++) {
                    let id = transformIDs[t];
                    value = transform.Get(id);
                    if (value != null) { transform.Set(id, value * scaleFactor); }
                }

            }

        }

    }

}

module.exports = ActionSetEM;