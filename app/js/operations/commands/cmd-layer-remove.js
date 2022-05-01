//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdLayerRemove extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();

    }

    _InternalExecute() {

        let layer = this._context;

        this._emitter.Do(mkfActions.LayerRemove, {
            target: layer
        });

        this._Success();

    }

}

module.exports = CmdLayerRemove;