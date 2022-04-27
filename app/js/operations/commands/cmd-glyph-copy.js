//
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

        if (variant.glyph.isNull) {
            this._Cancel();
            return;
        }

        try {
            let svgString = SVGOPS.SVGFromGlyphVariant(variant, true);
            navigator.clipboard.writeText(svgString);
        } catch (e) { console.log(e); }

        this._Success();
    }

}

module.exports = CmdGlyphCopy;