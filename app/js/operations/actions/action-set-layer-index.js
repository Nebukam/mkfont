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

class ActionSetLayerIndex extends ActionSetPropertyValue {
    constructor() { super(); }

    
    _UpdateValue(p_target, p_new, p_old) {
        p_target._variant.MoveLayer(p_target, p_new);
    }

}

module.exports = ActionSetLayerIndex;