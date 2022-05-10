'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);
const SHARED_OPS = require('./shared-ops');

class CmdLayerAddComp extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();

    }

    _InternalExecute() {

        let unicodeInfos;

        if (u.isArray(this._context)) {

            this._emitter.StartActionGroup({
                icon: `component-new`,
                name: `Composite`,
                title: `Creates components from character decomposition`
            });

            this._context.forEach(variant => {
                SHARED_OPS.BoostrapComp(this._emitter, variant, variant.glyph.unicodeInfos);
            });

            this._emitter.EndActionGroup();

        } else {

            unicodeInfos = this._context.glyph.unicodeInfos

            if (this._context.glyph.isNull || !unicodeInfos.comp) {
                this._Cancel();
                return;
            }

            this._emitter.StartActionGroup({
                icon: `link`,
                name: `Layer comp`,
                title: `Creates layer from character decomposition`
            });

            SHARED_OPS.BoostrapComp(this._emitter, this._context, unicodeInfos);

            this._emitter.EndActionGroup();

        }



        this._Success();

    }

}

module.exports = CmdLayerAddComp;