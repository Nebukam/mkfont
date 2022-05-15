'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdLayersAddUInfos extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._unicodes = null;
    }

    set unicodes(p_value) { this._unicodes = p_value; }

    _InternalExecute() {

        if (!this._unicodes || this._unicodes.length == 0) { return this._Cancel(); }

        this._emitter.StartActionGroup({
            icon: `component-new`,
            name: `Composite`,
            title: `Creates components from picker selection`
        });

        if (u.isArray(this._context)) {

            this._context.forEach(variant => {
                this._unicodes.forEach(infos => {
                    if (variant.availSlots <= 0) { return; }
                    this._emitter.Do(mkfActions.LayerAdd, {
                        target: variant,
                        layerValues: {
                            [mkfData.IDS.LYR_CHARACTER_NAME]: infos.char,
                            [mkfData.IDS.TR_LYR_BOUNDS_MODE]: variant._transformSettings.Get(mkfData.IDS.TR_BOUNDS_MODE),
                        },
                        expanded: false
                    });
                });
            });

        } else {

            let variant = this._context;
            this._unicodes.forEach(infos => {
                if (variant.availSlots <= 0) { return; }
                this._emitter.Do(mkfActions.LayerAdd, {
                    target: variant,
                    layerValues: {
                        [mkfData.IDS.LYR_CHARACTER_NAME]: infos.char,
                        [mkfData.IDS.TR_LYR_BOUNDS_MODE]: variant._transformSettings.Get(mkfData.IDS.TR_BOUNDS_MODE),
                    },
                    expanded: false
                });
            });
        }

        this._emitter.EndActionGroup();
        this._Success();

    }

}

module.exports = CmdLayersAddUInfos;