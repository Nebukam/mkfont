'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const mkfData = require(`../../data`);
const familyIDs = [
    mkfData.IDS.X_HEIGHT,
    mkfData.IDS.CAP_HEIGHT,
];

class ActionSetAscent extends nkm.data.ops.actions.SetPropertyValue {
    constructor() { super(); }

    // Expected operation format : { target:SimpleDataBlock, id:`ID`, value:*, resample:bool }

    _UpdateValue(p_target, p_new, p_old) {
        let
            resample = this._operation.resample,
            scaleFactor = p_new / p_old;            

        if (resample) {
            p_target.BatchSet(mkfData.UTILS.Resample(
                p_target.Values(familyIDs),
                familyIDs,
                scaleFactor), true);
        }

    }

}

module.exports = ActionSetAscent;