'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);
const { IDS } = require('../../data');

class CmdLayerMoveUp extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();

    }

    _InternalExecute() {

        if (u.isArray(this._context)) {

            let validMoves = [];
            this._context.forEach(layer => {
                let targetIndex = layer.index + 1;
                if (targetIndex >= layer._variant._layers.length) { return; }
                validMoves.push({ target: layer, id: IDS.LYR_INDEX, value: targetIndex });
            });

            if (validMoves.length == 0) {
                this._Cancel();
                return;
            }

            this._emitter.StartActionGroup({
                icon: `up-short`,
                name: `Moved components up`,
                title: `Changed the order of components in multiple glyphs`
            });

            validMoves.forEach(move => {
                this._emitter.Do(mkfActions.SetLayerIndex, move);
            });

            this._emitter.EndActionGroup();

        } else {

            let targetIndex = this._context.index + 1;
            if (targetIndex >= this._context._variant._layers.length) {
                this._Cancel();
                return;
            }

            this._emitter.Do(mkfActions.SetLayerIndex, {
                target: this._context,
                id: IDS.LYR_INDEX,
                value: targetIndex
            });

        }

        this._Success();

    }

}

module.exports = CmdLayerMoveUp;