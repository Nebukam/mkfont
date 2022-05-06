'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdGlyphCopy extends actions.Command {
    constructor() { super(); }

    _InternalExecute() {

        let family = this._emitter.data,
            variant = family.GetGlyph(this._context?.u || this._emitter.inspectedData.lastItem?.u).activeVariant;

        globalThis.__copySourceString = null;
        globalThis.__copySourceVariant = null;
        globalThis.__copySourceLayers = null;
        globalThis.__copySourceEM = null;

        if (variant.glyph.isNull) {
            this._Cancel();
            return;
        }

        try {
            let svgString = SVGOPS.SVGFromGlyphVariant(variant, true);
            navigator.clipboard.writeText(svgString);
            globalThis.__copySourceString = svgString;
            globalThis.__copySourceVariant = variant;
            globalThis.__copySourceLayers = variant;
            globalThis.__copySourceEM = family.Get(mkfData.IDS.EM_UNITS);
        } catch (e) { console.log(e); }

        this._Success();
    }

}

module.exports = CmdGlyphCopy;