'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const data = require(`../../data`);

class ActionSetPropertyValue extends actions.Action {
    constructor() { super(); }


    static get mergeable() { return true; }

    CanMerge(p_operation) {
        return (this._operation.target == p_operation.target && this._operation.id == p_operation.id)
    }

    // Expected operation format : { target:SimpleDataBlock, id:`ID`, value:* }

    _InternalDo(p_operation, p_merge = false) {

        let
            target = p_operation.target,
            propertyId = p_operation.id,
            oldValue = target.Get(propertyId),
            newValue = p_operation.value;

        if (!p_merge) { p_operation.oldValue = oldValue; }
        else { this._operation.value = newValue; }

        target.Set(propertyId, newValue, true);
        this._UpdateValue(target, newValue, oldValue);
        target.CommitUpdate();


    }

    _UpdateDisplayInfos() {
        this.displayInfos = {
            name: `Set ${this._operation.id}`,
            title: `${this._operation.target}'s ${this._operation.id}\n` +
                `from : ${this._operation.oldValue}\n` +
                `to: ${this._operation.value}`
        };
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