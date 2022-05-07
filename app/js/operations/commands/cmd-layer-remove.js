'use strict';

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

        if (u.isArray(this._context)) {

            this._emitter.StartActionGroup({
                icon: `remove`,
                name: `Remove components`,
                title: `Remove components on multiple glyphs`
            });

            this._context.forEach(layer => {
                this._emitter.Do(mkfActions.LayerRemove, {
                    target: layer
                });
            });

            this._emitter.EndActionGroup();

        } else {
            this._emitter.Do(mkfActions.LayerRemove, {
                target: this._context
            });
        }        

        this._Success();

    }

}

module.exports = CmdLayerRemove;