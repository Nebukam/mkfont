'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const io = nkm.io;

const IDS = require(`./ids`);
const UTILS = require(`./utils`);

const __noResolution = [];

class FontObjectData extends nkm.data.SimpleDataBlock {

    constructor() {
        super();
    }

    _Init() {
        super._Init();

        this._fontObject = this._BuildFontObject();
        this._scheduledUpdate = nkm.com.DelayedCall(this._Bind(this.CommitUpdate));
        this._scheduledObjectUpdate = nkm.com.DelayedCall(this._Bind(this._UpdateFontObject), 16);
        this._isDefault = false;

    }

    get fontObject() { return this._fontObject; }

    _OnReset(p_individualSet, p_silent) {
        super._OnReset(p_individualSet, p_silent);
        if (this._fontObject) { this._UpdateFontObject(); }
    }

    _BuildFontObject() { return null; }

    _UpdateFontObject() { }

    CommitUpdate() {
        this._scheduledObjectUpdate.Schedule();
        super.CommitUpdate();
    }

    _CleanUp() {
        if (this._fontObject) { this._fontObject.remove(); }
        super._CleanUp();
    }
}

module.exports = FontObjectData;