//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdLayerAdd extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();

    }

    _InternalExecute() {

        let variant = this._context;

        this._emitter.Do(mkfActions.LayerAdd, {
            target: variant,
            index: -1
        });

        this._Success();

    }

}

module.exports = CmdLayerAdd;