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

class CmdLigatureFromSelection extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
    }

    _GetLigaName() {
        let selection = this._emitter.inspectedData.stack._array,
            uniStruct = ``;
        selection.forEach(sel => { uniStruct += sel.char; });
        return uniStruct == `` ? null : uniStruct;
    }

    _InternalExecute() {

        let
            family = this._emitter.data,
            uniStruct = [],
            selection;

        if (u.isString(this._context)) {

            selection = this._context.split(``);

            if (selection.length < 2) { return this._Cancel(); }

            selection.forEach((sel, i) => {
                uniStruct.push(UNICODE.GetAddress(sel));
                selection[i] = UNICODE.GetInfos(UNICODE.GetAddress(sel));
            });

        } else {

            selection = [...this._emitter.inspectedData.stack._array];

            if (selection.length < 2) { return this._Cancel(); }

            selection.forEach(sel => {
                if (sel.ligature) { sel.char.split(``).forEach(u => { uniStruct.push(UNICODE.GetAddress(u)); }); }
                else { uniStruct.push(UNICODE.GetAddress(sel.char)); }
            });

        }

        let
            unicodeInfos = UNICODE.GetInfos(uniStruct, true),
            glyph = family.GetGlyph(unicodeInfos.u);

        if (!glyph.isNull) {
            this._emitter.inspectedData.Set(unicodeInfos);
            return this._Cancel();
        }

        let addComponents = nkm.ui.INPUT.shift;

        if (addComponents) {
            this._emitter.StartActionGroup({
                icon: `text-liga-new`,
                name: `Ligatures creation`,
                title: `Created ligature glyphs`
            });
        }

        this._emitter.Do(mkfActions.GlyphCreate, {
            family: family,
            unicode: unicodeInfos,
            path: SVGOPS.EmptySVGStats(),
            transforms: {
                [mkfData.IDS.WIDTH]: family.Get(mkfData.IDS.WIDTH),
                [mkfData.IDS.TR_AUTO_WIDTH]: true
            }
        });

        glyph = family.GetGlyph(unicodeInfos.u);

        if (addComponents) {
            //also create components
            SHARED_OPS.AddLayersFromList(this._emitter, glyph.activeVariant, selection);

            this._emitter.Do(mkfActions.SetPropertyMultiple, {
                target: glyph.activeVariant,
                values: {
                    [mkfData.IDS.FLATTEN_LAYERS]: true
                }
            });

            this._emitter.Do(mkfActions.SetPropertyMultiple, {
                target: glyph.activeVariant.transformSettings,
                values: {
                    [mkfData.IDS.TR_SCALE_MODE]: mkfData.ENUMS.SCALE_MANUAL,
                    [mkfData.IDS.TR_SCALE_FACTOR]: 1
                }
            });

            glyph.activeVariant._layers.ForEach((lyr, i) => {

                let params = {
                    [mkfData.IDS.TR_BOUNDS_MODE]: mkfData.ENUMS.BOUNDS_OUTSIDE,
                    [mkfData.IDS.TR_LYR_BOUNDS_MODE]: mkfData.ENUMS.BOUNDS_OUTSIDE,
                    [mkfData.IDS.TR_ANCHOR]: mkfData.ENUMS.ANCHOR_BOTTOM_RIGHT,
                    [mkfData.IDS.TR_LYR_SELF_ANCHOR]: mkfData.ENUMS.ANCHOR_BOTTOM_LEFT,
                };

                if (i != 0) {
                    params[mkfData.IDS.LYR_USE_PREV_LAYER] = true;
                }else{
                    params[mkfData.IDS.TR_ANCHOR] =  mkfData.ENUMS.ANCHOR_BOTTOM_LEFT;
                }



                this._emitter.Do(mkfActions.SetPropertyMultiple, {
                    target: lyr,
                    values: params
                });
            });



        }

        if (addComponents) { this._emitter.EndActionGroup(); }

        this._emitter.inspectedData.Set(unicodeInfos);
        this._Success();

    }

}

module.exports = CmdLigatureFromSelection;