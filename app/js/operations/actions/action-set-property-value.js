'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const mkfData = require(`../../data`);

class ActionSetPropertyValue extends actions.Action {
    constructor() { super(); }


    static get mergeable() { return true; }

    CanMerge(p_operation) {
        //Also check if operation target is array, this mean it's a group op
        return (this._operation.target == p_operation.target && this._operation.id == p_operation.id);
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
            for (let i = 0; i < target.length; i++) { oldValue.push(target[i].Get(propertyId)); }
        } else {
            oldValue = target.Get(propertyId);
        }

        if (!p_merge) { p_operation.oldValue = oldValue; }
        else { this._operation.value = newValue; }

        if (nkm.u.isArray(target)) {
            for (let i = 0; i < target.length; i++) {
                let tgt = target[i];
                tgt.Set(propertyId, newValue, true);
                this._UpdateValue(tgt, newValue, oldValue[i]);
                tgt.CommitUpdate();
            }
        } else {
            target.Set(propertyId, newValue, true);
            this._UpdateValue(target, newValue, oldValue);
            target.CommitUpdate();
        }
    }

    _UpdateDisplayInfos() {

        let
            pInfos = mkfData.INFOS.Get(this._operation.id),
            label = pInfos ? pInfos.label : this._operation.id;

        this.displayInfos = {
            name: `Set ${label}`,
            title: `${nkm.u.isArray(this._operation.target) ? 'Multiple' : this._operation.target + `'s`} ${label}\n` +
                `from : ${nkm.u.isArray(this._operation.oldValue) ? 'Multiple' : this._operation.oldValue}\n` +
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
                tgt.Set(this._operation.id, oldValue[i], true);
                this._UpdateValue(tgt, oldValue[i], newValue);
                tgt.CommitUpdate();
            }
        } else {
            target.Set(this._operation.id, oldValue, true);
            this._UpdateValue(target, oldValue, newValue);
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
                tgt.Set(this._operation.id, newValue, true);
                this._UpdateValue(tgt, newValue, oldValue[i]);
                tgt.CommitUpdate();
            }
        } else {
            target.Set(this._operation.id, newValue, true);
            this._UpdateValue(target, newValue, oldValue);
            target.CommitUpdate();
        }

    }

}

module.exports = ActionSetPropertyValue;