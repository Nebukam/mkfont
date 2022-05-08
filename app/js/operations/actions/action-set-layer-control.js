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

class ActionSetLayerControl extends ActionSetPropertyValue {
    constructor() { super(); }

    _InternalDo(p_operation, p_merge = false) {

        let
            target = p_operation.target,
            currentControl = target._variant.controlLayer;

        if (!p_merge && !p_operation.prevControl) {
            p_operation.prevControl = currentControl == target ? null : currentControl;
        }

        super._InternalDo(p_operation, p_merge);

    }

    _UpdateValue(p_target, p_new, p_old) {

        if (this._operation.prevControl) { this._operation.prevControl.Set(this._operation.id, !p_new); }
        p_target._variant.controlLayer = p_new ? p_target : this._operation.prevControl;

    }

}

module.exports = ActionSetLayerControl;