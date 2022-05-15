'use strict';

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



        if (u.isArray(this._context)) {

            this._emitter.StartActionGroup({
                icon: `component-new`,
                name: `New component`,
                title: `Create new component on multiple glyphs.`
            });

            this._context.forEach(variant => {
                if (variant.availSlots <= 0) { return; }
                this._emitter.Do(mkfActions.LayerAdd, {
                    target: variant,
                    index: -1,
                    layerValues:{
                        [mkfData.IDS.TR_LYR_BOUNDS_MODE]:variant._transformSettings.Get(mkfData.IDS.TR_BOUNDS_MODE),
                    }
                });
            });

            this._emitter.EndActionGroup();

        } else {

            let variant = this._context;
            if (variant.availSlots <= 0) {
                this._Cancel();
                return;
            }

            this._emitter.Do(mkfActions.LayerAdd, {
                target: variant,
                index: -1,
                layerValues:{
                    [mkfData.IDS.TR_LYR_BOUNDS_MODE]:variant._transformSettings.Get(mkfData.IDS.TR_BOUNDS_MODE),
                }
            });

        }


        this._Success();

    }

}

module.exports = CmdLayerAdd;