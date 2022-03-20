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

    _PostInit(){
        super._PostInit();
        for(let i = 0; i < this._values.length; i++){
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
                if(u.isInstanceOf(obj.value, nkm.data.catalogs.CatalogItem)){
                    v[p] = { value:obj.value.value, override:obj.override };
                }else{
                    v[p] = { value:obj.value, override:obj.override };
                }
            }
        } else if (u.isObject(p_ids)) {
            for (let p in this._values) {
                if (!(p in p_ids)) { continue; }
                let obj = this._values[p];
                if(u.isInstanceOf(obj.value, nkm.data.catalogs.CatalogItem)){
                    v[p] = { value:obj.value.value, override:obj.override };
                }else{
                    v[p] = { value:obj.value, override:obj.override };
                }
            }
        } else {
            for (let p in this._values) {
                let obj = this._values[p];
                if(u.isInstanceOf(obj.value, nkm.data.catalogs.CatalogItem)){
                    v[p] = { value:obj.value.value, override:obj.override };
                }else{
                    v[p] = { value:obj.value, override:obj.override };
                }
            }
        }
        return v;
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