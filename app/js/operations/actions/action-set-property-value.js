'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const data = require(`../../data`);

class ActionSetPropertyValue extends actions.Action {
    constructor() { super(); }

    // Expected operation format : { target:SimpleDataBlock, id:`ID`, value:* }

    _InternalDo(p_operation, p_merge = false) {

        let
            target = p_operation.target,
            propertyId = p_operation.id,
            oldValue = target.Get(propertyId),
            newValue = p_operation.value;

        p_operation.oldValue = oldValue;
        target.Set(propertyId, newValue, true);
        this._UpdateValue(target, newValue, oldValue);
        target.CommitUpdate();

    }

    _UpdateValue(p_target, p_from, p_to) {

    }

    _InternalUndo() {
        let
            target = this._operation.target,
            oldValue = this._operation.oldValue,
            newValue = this._operation.value;

        target.Set(this._operation.id, oldValue, true);
        this._UpdateValue(target, oldValue, newValue);
        target.CommitUpdate();
    }

    _InternalRedo() {

        let
            target = this._operation.target,
            oldValue = this._operation.oldValue,
            newValue = this._operation.value;

        target.Set(this._operation.id, newValue, true);
        this._UpdateValue(target, newValue, oldValue);
        target.CommitUpdate();

    }

}

module.exports = ActionSetPropertyValue;