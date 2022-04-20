'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const data = require(`../../data`);

class ActionSetPropertyOverride extends actions.Action {
    constructor() { super(); }


    static get mergeable() { return true; }

    CanMerge(p_operation) {
        //Also check if operation target is array, this mean it's a group op
        return (this._operation.target == p_operation.target && this._operation.id == p_operation.id)
    }

    // Expected operation format : { target:SimpleDataBlock, id:`ID`, value:* }

    _InternalDo(p_operation, p_merge = false) {

        let
            target = p_operation.target,
            propertyId = p_operation.id,
            oldValue,
            newValue = p_operation.value;

        if (nkm.u.isArray(target)) {
            oldValue = [];
            for (let i = 0; i < target.length; i++) { oldValue.push(target[i]._values[propertyId].override); }
        } else {
            oldValue = target._values[this._operation.id].override;
        }

        if (!p_merge) { p_operation.oldValue = oldValue; }
        else { this._operation.value = newValue; }

        if (nkm.u.isArray(target)) {
            for (let i = 0; i < target.length; i++) {
                let tgt = target[i];
                
                tgt._values[this._operation.id].override = newValue;
                tgt.CommitUpdate();
            }
        } else {
            target._values[this._operation.id].override = newValue;
            target.CommitUpdate();
        }



    }

    _UpdateDisplayInfos() {
        this.displayInfos = {
            name: `Set ${this._operation.id}'s override`,
            title: `${nkm.u.isArray(this._operation.target) ? 'Multiple' : this._operation.target + `'s`} ${this._operation.id}\n` +
                `from : ${this._operation.oldValue}\n` +
                `to: ${this._operation.value}`
        };
    }

    _UpdateValue(p_target, p_from, p_to) { }

    _InternalUndo() {
        let
            target = this._operation.target,
            oldValue = this._operation.oldValue,
            newValue = this._operation.value;

        if (nkm.u.isArray(target)) {
            for (let i = 0; i < target.length; i++) {
                let tgt = target[i];
                tgt._values[this._operation.id].override = oldValue[i];
                tgt.CommitUpdate();
            }
        } else {
            target._values[this._operation.id].override = oldValue;
            target.CommitUpdate();
        }

    }

    _InternalRedo() {

        let
            target = this._operation.target,
            oldValue = this._operation.oldValue,
            newValue = this._operation.value;

        if (nkm.u.isArray(target)) {
            for (let i = 0; i < target.length; i++) {
                let tgt = target[i];
                
                tgt._values[this._operation.id].override = newValue;
                tgt.CommitUpdate();
            }
        } else {
            target._values[this._operation.id].override = newValue;
            target.CommitUpdate();
        }

    }

}

module.exports = ActionSetPropertyOverride;