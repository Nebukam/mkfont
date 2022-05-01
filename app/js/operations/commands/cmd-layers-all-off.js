//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdLayersOff extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();

    }

    _InternalExecute() {

        let
            variant = this._context,
            layerList = variant.layers._array,
            ignore = true;

        layerList.forEach(element => { if (element.Get(mkfData.IDS.EXPORT_GLYPH)) { ignore = false; } });

        if (ignore) {
            this._Cancel();
            return;
        }

        this._emitter.StartActionGroup({
            icon: `visible`,
            name: `All layers visible`,
            title: `Make all layers visible.`
        });

        this._emitter.Do(mkfActions.SetProperty, {
            target: layerList,
            id: mkfData.IDS.EXPORT_GLYPH,
            value: false
        });

        this._emitter.EndActionGroup();

        this._Success();

    }

}

module.exports = CmdLayersOff;