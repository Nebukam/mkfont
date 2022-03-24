'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const io = nkm.io;

const IDS = require(`./ids`);
const UTILS = require(`./utils`);

class SimpleDataEx extends nkm.data.SimpleDataBlock {

    constructor() {
        super();
    }

    _Init() {
        super._Init();

        this._fontObject = this._BuildFontObject();
        this._scheduledUpdate = nkm.com.DelayedCall(this._Bind(this.CommitUpdate));
        this._scheduledObjectUpdate = nkm.com.DelayedCall(this._Bind(this._UpdateFontObject));
        this._isDefault = false;

    }

    _PostInit() {
        super._PostInit();
        for (let i = 0; i < this._values.length; i++) {
            let valueObject = this._values[i];
            valueObject.override = valueObject.value == null ? false : true;
        }
        // if value == null
    }

    get resolutionFallbacks() { return []; }

    get fontObject() { return this._fontObject; }

    Resolve(p_id) {
        return UTILS.Resolve(p_id, this, ...this.resolutionFallbacks);
    }

    ValuesAndOverrides(p_ids) {
        let v = {};
        if (u.isArray(p_ids)) {
            for (let p in this._values) {
                if (!p_ids.includes(p)) { continue; }
                let obj = this._values[p];
                if (`override` in obj) { v[p] = { value: obj.value, override: obj.override }; }
                else { v[p] = obj.value; }

            }
        } else if (u.isObject(p_ids)) {
            for (let p in this._values) {
                if (!(p in p_ids)) { continue; }
                let obj = this._values[p];
                if (`override` in obj) { v[p] = { value: obj.value, override: obj.override }; }
                else { v[p] = obj.value; }
            }
        } else {
            for (let p in this._values) {
                let obj = this._values[p];
                if (`override` in obj) { v[p] = { value: obj.value, override: obj.override }; }
                else { v[p] = obj.value; }
            }
        }
        return v;
    }

    BatchSetWithOverrides(p_values, p_silent = false) {
        if (u.isInstanceOf(p_values, nkm.data.SimpleDataBlock)) {
            for (var p in p_values._values) {
                let srcObj = p_values._values[p],
                    tgtObj = this._values[p];
                if (`override` in srcObj) { tgtObj.override = srcObj.override; }
                this.Set(p, srcObj.value, true);
            }
        }
        else {
            for (var p in p_values) {
                let srcObj = p_values[p];
                if (u.isObject(srcObj)) {
                    if (`override` in srcObj) { this._values[p].override = srcObj.override; }
                    if (`value` in srcObj) { this.Set(p, srcObj.value, true); }
                    else { this.Set(p, srcObj, true); }

                } else {
                    this.Set(p, srcObj, true);
                }
            }
        }
        if (!p_silent) { this.CommitUpdate(); }
    }


    _BuildFontObject() {
        return null;
    }

    _UpdateFontObject() {

    }

    CommitUpdate() {
        this._scheduledObjectUpdate.Schedule();
        super.CommitUpdate();
    }

    _CleanUp() {
        if (this._fontObject) { this._fontObject.remove(); }
        super._CleanUp();
    }
}

module.exports = SimpleDataEx;