'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const data = require(`../../data`);

class ActionSetPropertyValueMultiple extends actions.Action {
    constructor() { super(); }

    // Expected operation format : { target:SimpleDataBlock, values:{ id:* } }

    _InternalDo(p_operation, p_merge = false) {

        let
            target = p_operation.target,
            values = p_operation.values,
            oldValues = target.Values(values);

        p_operation.oldValues = oldValues;
        target.BatchSet(values);
        this._UpdateValues(target, values, oldValues);
        target.CommitUpdate();

    }

    _UpdateValues(p_target, p_from, p_to) {

    }

    _InternalUndo() {

        let
            target = this._operation.target,
            oldValues = this._operation.oldValues,
            newValues = this._operation.values;

        target.BatchSet(oldValues, true);
        this._UpdateValues(target, oldValues, newValues);
        target.CommitUpdate();
    }

    _InternalRedo() {

        let
            target = this._operation.target,
            oldValues = this._operation.oldValues,
            newValues = this._operation.values;

        target.BatchSet(newValues, true);
        this._UpdateValues(target, newValues, oldValues);
        target.CommitUpdate();

    }

}

module.exports = ActionSetPropertyValueMultiple;