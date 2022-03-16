'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const mkfData = require(`./data`);

class ContentUpdater extends nkm.com.helpers.SingletonEx {
    constructor() { super(); }

    _Init() {

        super._Init();

        this._data = [];
        this._methods = new Map();
        this._totalCount = 0;
        this._processedCount = 0;

        this._delayedUpdate = nkm.com.DelayedCall(this._Bind(this._Update));

    }

    static Push(p_data, p_method) {
        this.instance._Push(p_data, p_method);
    }

    _Push(p_data, p_method) {

        let array = this._methods.get(p_data);

        if (!array) {
            array = [];
            this._methods.set(p_data, array);
            this._data.push(p_data);
            this._totalCount ++;
        }

        if (array.includes(p_method)) { return; }

        array.push(p_method);
        this._delayedUpdate.Schedule();

    }

    _Update() {

        let updateCount = Math.min(this._data.length, 1);
        for (let i = 0; i < updateCount; i++) {

            let data = this._data.shift(),
                methods = this._methods.get(data);

            this._methods.delete(data);
            for (let m = 0; m < methods.length; m++) {
                methods[m].call(data);
            }
        }

        this._processedCount += updateCount;
        this._Broadcast(nkm.com.SIGNAL.UPDATED, this._processedCount, this._totalCount);

        if (this._data.length != 0) {
            this._delayedUpdate.Schedule();
        }else{
            this._processedCount = 0;
            this._totalCount = 0;
            this._Broadcast(nkm.com.SIGNAL.READY);
        }

    }

}

module.exports = ContentUpdater;