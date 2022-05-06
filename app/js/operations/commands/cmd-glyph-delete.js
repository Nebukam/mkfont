'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdGlyphDelete extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();

        this._glyphInfos = null;
    }

    set glyphInfos(p_value) { this._glyphInfos = p_value; }
    get glyphInfos() { return this._glyphInfos; }

    _InternalExecute() {

        let family = this._emitter.data;

        if (u.isInstanceOf(this._context, mkfData.GlyphVariant)) {
            // Delete a single glyph
            this._Delete(this._context.glyph);
        } else {

            let list;

            if (u.isArray(this._context)) { list = this._context; }
            else { list = this._emitter.inspectedData.stack._array; }

            // Delete a selection of glyphs

            this._emitter.StartActionGroup({
                icon: `remove`,
                name: `Batch glyph delete`,
                title: `Deleted selected glyphs.`
            });

            for (let i = 0; i < list.length; i++) {
                this._Delete(family.GetGlyph(list[i].u));
            }

            this._emitter.EndActionGroup();

        }

        this._Success();

    }

    _Delete(p_glyph) {

        if (p_glyph.isNull) { return; }

        this._emitter.Do(mkfActions.GlyphDelete, {
            glyph: p_glyph,
            family: this._emitter.data
        });

        this._emitter._bindingManager.UnbindVariants(p_glyph);

    }

}

module.exports = CmdGlyphDelete;