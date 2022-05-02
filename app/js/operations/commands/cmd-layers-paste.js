'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const SHARED_OPS = require(`./shared-ops`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdLayersPaste extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();

    }

    _InternalExecute() {

        let family = this._emitter.data;

        if (!globalThis.__copySourceLayers) {
            this._Cancel();
            return;
        }

        let scaleFactor = globalThis.__copySourceEM ? family.Get(mkfData.IDS.EM_UNITS) / globalThis.__copySourceEM : 1;

        if (!nkm.ui.INPUT.alt) {

            if (this._context == globalThis.__copySourceLayers) {
                this._Cancel();
                return;
            }

            this._emitter.StartActionGroup({
                icon: `clipboard-read`,
                name: `Replace layers`,
                title: `Replaced layers`
            });

            SHARED_OPS.RemoveLayers(this._emitter, this._context);

        } else {
            this._emitter.StartActionGroup({
                icon: `clipboard-read`,
                name: `Paste layers`,
                title: `Pasted layers`
            });
        }

        SHARED_OPS.RemoveLayers(this._emitter, this._context, globalThis.__copySourceLayers, scaleFactor);

        this._emitter.EndActionGroup();

        this._Success();

    }

}

module.exports = CmdLayersPaste;