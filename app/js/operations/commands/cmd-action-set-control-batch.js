'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdLayersControlChange extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
    }

    set toggle(p_value) { this._toggle = p_value; }

    _InternalExecute() {

        this._emitter.StartActionGroup({
            icon: `gear`,
            name: `Control component`,
            title: `Change the Control status of components.`
        });

        this._context.forEach((layer) => {

            this._emitter.Do(mkfActions.SetLayerControl, {
                target: layer,
                id: mkfData.IDS.LYR_IS_CONTROL_LAYER,
                value: this._toggle
            });

        });

        this._emitter.EndActionGroup();

        this._Success();

    }

}

module.exports = CmdLayersControlChange;