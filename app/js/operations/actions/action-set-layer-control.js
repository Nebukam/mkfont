'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);

class ActionSetLayerControl extends nkm.data.ops.actions.SetPropertyValue {
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