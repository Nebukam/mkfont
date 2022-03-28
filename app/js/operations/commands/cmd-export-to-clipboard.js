//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.utils;

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

        if (nkm.ui.dom.isTextHighlighted) {
            console.log(`text is highlighted : ${nkm.ui.dom.highlightedText}`);
            this._Cancel();
            return;
        }

        this._context = this._emitter.data;
        if (u.isInstanceOf(this._context, mkfData.Glyph)) { this._context = this._context.GetVariant(this._context.family.selectedSubFamily); }

        try {

            let
                inlineTr = ``,
                markedPath = ``,
                tr = this._context._transformSettings,
                p = this._context.Get(mkfData.IDS.PATH_DATA);

            for (let p in tr._values) { inlineTr += `${p}="${tr._values[p].value}" `; }

            markedPath = `<path style="stroke:#FF00FF;fill:none" d="M 0 0 L ${p.width} 0 L ${p.width} ${p.height} L 0 ${p.height} z"></path>`;

            let string = `<svg viewBox="0 0 ${p.width} ${p.height}" ${inlineTr}><path d="${p.path}"></path>${markedPath}</svg>`;
            clipboard.writeText(string);
        } catch (e) { console.log(e); }

        this._Success();
    }

}

module.exports = CmdExportToClipboard;