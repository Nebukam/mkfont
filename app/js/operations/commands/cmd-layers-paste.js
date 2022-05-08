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

        if (u.isArray(this._context)) {

            if (nkm.ui.INPUT.alt) {

                this._emitter.StartActionGroup({
                    icon: `clipboard-read`,
                    name: `Copy comp. transforms`,
                    title: `Replaced layers`
                });

                this._context.forEach(variant => {
                    if (variant != globalThis.__copySourceLayers) {
                        SHARED_OPS.PasteLayersTransforms(this._emitter, variant, globalThis.__copySourceLayers, scaleFactor, false);
                    }
                });



            } else if (!nkm.ui.INPUT.shift) {

                this._emitter.StartActionGroup({
                    icon: `clipboard-read`,
                    name: `Replace components`,
                    title: `Replaced components`
                });

                this._context.forEach(variant => {
                    if (variant != globalThis.__copySourceLayers) {
                        SHARED_OPS.RemoveLayers(this._emitter, variant);
                        SHARED_OPS.AddLayers(this._emitter, variant, globalThis.__copySourceLayers, scaleFactor, false);
                    }
                });

            } else {

                this._emitter.StartActionGroup({
                    icon: `clipboard-read`,
                    name: `Paste components`,
                    title: `Pasted components`
                });

                this._context.forEach(variant => {
                    if (variant != globalThis.__copySourceLayers) {
                        SHARED_OPS.AddLayers(this._emitter, variant, globalThis.__copySourceLayers, scaleFactor, false);
                    }
                });

            }

            this._emitter.EndActionGroup();

        } else {

            //Solo !
            if (this._context == globalThis.__copySourceLayers) {
                this._Cancel();
                return;
            }

            if (nkm.ui.INPUT.alt) {

                this._emitter.StartActionGroup({
                    icon: `clipboard-read`,
                    name: `Copy comp. transforms`,
                    title: `Replaced layers`
                });

                SHARED_OPS.PasteLayersTransforms(this._emitter, this._context, globalThis.__copySourceLayers, scaleFactor, false);

            } else {

                if (!nkm.ui.INPUT.shift) {

                    this._emitter.StartActionGroup({
                        icon: `clipboard-read`,
                        name: `Replace components`,
                        title: `Replaced components`
                    });

                    SHARED_OPS.RemoveLayers(this._emitter, this._context);

                } else {
                    this._emitter.StartActionGroup({
                        icon: `clipboard-read`,
                        name: `Paste components`,
                        title: `Pasted components`
                    });
                }

                SHARED_OPS.AddLayers(this._emitter, this._context, globalThis.__copySourceLayers, scaleFactor);
            }

            this._emitter.EndActionGroup();

        }

        this._Success();

    }

}

module.exports = CmdLayersPaste;