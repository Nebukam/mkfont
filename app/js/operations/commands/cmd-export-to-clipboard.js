//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdExportToClipboard extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();

        this._shortcut = actions.Keystroke.CreateFromString("Ctrl C");
        this._glyphInfos = null;

        this.Disable();

    }

    set glyphInfos(p_value) { this._glyphInfos = p_value; }
    get glyphInfos() { return this._glyphInfos; }

    _InternalExecute() {

        if (nkm.ui.dom.isTextHighlighted || !this._emitter) {
            this._Cancel();
            return;
        }

        let
            editor = nkm.datacontrols.FindEditor(this._emitter),
            family = editor.data,
            variant = family.GetGlyph(this._context?.u || editor.inspectedData.lastItem?.u).GetVariant(family.selectedSubFamily);

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

module.exports = CmdExportToClipboard;