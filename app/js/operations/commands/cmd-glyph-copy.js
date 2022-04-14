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

        if (this._shortcutActivated &&
            nkm.ui.dom.isTextHighlighted) {
            this._Cancel();
            return;
        }

        let family = this._emitter.data,
            variant = family.GetGlyph(this._context?.u || this._emitter.inspectedData.lastItem?.u).GetVariant(family.selectedSubFamily);

        if (variant.glyph.isNull) {
            this._Cancel();
            return;
        }

        try {
            navigator.clipboard.writeText(SVGOPS.SVGFromGlyphVariant(variant, true));
        } catch (e) { console.log(e); }

        this._Success();
    }

}

module.exports = CmdGlyphCopy;