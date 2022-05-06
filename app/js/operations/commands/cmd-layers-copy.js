'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdLayersCopy extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();

    }

    _InternalExecute() {

        let
            variant = this._context,
            layerList = variant.layers._array;

        globalThis.__copySourceLayers = null;
        globalThis.__copySourceEM = null;

        if (layerList.length == 0) {
            this._Cancel();
            return;
        }

        globalThis.__copySourceLayers = variant;
        globalThis.__copySourceEM = this._emitter.data.Get(mkfData.IDS.EM_UNITS);

        this._Success();

    }

}

module.exports = CmdLayersCopy;