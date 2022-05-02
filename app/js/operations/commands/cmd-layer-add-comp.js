'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdLayerAddComp extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();

    }

    _InternalExecute() {

        let
            variant = this._context,
            unicodeInfos = variant.glyph.unicodeInfos;

        if (variant.glyph.isNull || !unicodeInfos.comp) {
            this._Cancel();
            return;
        }

        this._emitter.StartActionGroup({
            icon: `link`,
            name: `Layer comp`,
            title: `Creates layer from character decomposition`
        });

        let
            maxw = 0,
            hasLayersAlready = !variant._layers.isEmpty;

        unicodeInfos.comp.forEach(c => {
            let ch = UNICODE.GetUnicodeCharacter(Number.parseInt(c, 16));
            if (!this._Has(ch, `U+${c}`)) {
                this._emitter.Do(mkfActions.LayerAdd, {
                    target: variant,
                    layerValues: { [mkfData.IDS.CHARACTER_NAME]: ch },
                    index: -1
                });
                let g = variant.glyph.family.GetGlyph(c);
                if (!g.isNull) { maxw = Math.max(maxw, g.activeVariant.Get(mkfData.IDS.EXPORTED_WIDTH)); }
            }
        });

        if (!hasLayersAlready && maxw) {
            this._emitter.Do(mkfActions.SetPropertyMultiple, {
                target: variant,
                values: {
                    [mkfData.IDS.TR_AUTO_WIDTH]: false,
                    [mkfData.IDS.WIDTH]: maxw
                }
            });
        }

        this._emitter.EndActionGroup();

        this._Success();

    }

    _Has(p_char, p_uni) {
        if (this._context._layers.isEmpty) { return false; }
        for (let i = 0, n = this._context._layers.count; i < n; i++) {
            let
                layer = this._context._layers.At(i),
                cval = layer.Get(mkfData.IDS.CHARACTER_NAME);

            if (cval == p_char || cval == p_uni) { return true; }
        }

        return false;
    }

}

module.exports = CmdLayerAddComp;