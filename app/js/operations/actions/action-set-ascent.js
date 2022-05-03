'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const mkfData = require(`../../data`);
const svgpath = require('svgpath');

const ActionSetPropertyValue = require(`./action-set-property-value`);

const familyIDs = [
    mkfData.IDS.X_HEIGHT,
    mkfData.IDS.CAP_HEIGHT,
];

class ActionSetAscent extends ActionSetPropertyValue {
    constructor() { super(); }

    // Expected operation format : { target:SimpleDataBlock, id:`ID`, value:*, resample:bool }

    _UpdateValue(p_target, p_from, p_to) {
        let
            resample = this._operation.resample,
            scaleFactor = p_from / p_to;
            

        if (resample) {
            p_target.BatchSet(mkfData.UTILS.Resample(
                p_target.Values(familyIDs),
                familyIDs,
                scaleFactor), true);
        }

    }

}

module.exports = ActionSetAscent;