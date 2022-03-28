//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.utils;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdImportClipboard extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();

        this._shortcut = actions.Keystroke.CreateFromString("Ctrl V");
        this._glyphInfos = null;

        this.Disable();
    }

    set glyphInfos(p_value) { this._glyphInfos = p_value; }
    get glyphInfos() { return this._glyphInfos; }

    _InternalExecute() {

        if (nkm.ui.dom.isTextHighlighted) {
            this._Cancel();
            return;
        }

        this._context = this._emitter.data;
        if (u.isInstanceOf(this._context, mkfData.Glyph)) { this._context = this._context.GetVariant(this._context.family.selectedSubFamily); }

        let
            svgStats = { exists: false },
            svgString = clipboard.readText();

        try {

            svgStats = SVGOPS.SVGStats(svgString);
        } catch (e) { console.log(e); }

        //console.log(svgStats);

        if (!svgStats.exists) {
            /*
            nkm.dialog.Push({
                title: `Invalid content`,
                message: `Couldn't find how to use the selected file :()`,
                actions: [{ label: `Okay` }],
                origin: this, flavor: nkm.com.FLAGS.WARNING
            });
            */
            this._Cancel();
            return;
        }

        let
            editor = nkm.datacontrols.FindEditor(this._emitter),
            family = editor.data;

        // Check if glyph exists
        let
            variant = this._context,
            glyph = variant.glyph,
            trValues = SVGOPS.TryGetTRValues(svgString),
            unicodeInfos;

        if (glyph.isNull) {
            // Need to create a new glyph!
            unicodeInfos = glyph.unicodeInfos;
            editor.Do(mkfActions.CreateGlyph, {
                family: family,
                unicode: unicodeInfos,
                path: svgStats,
                transforms: trValues
            });
        } else {
            editor.Do(mkfActions.SetProperty, {
                target: variant,
                id: mkfData.IDS.PATH_DATA,
                value: svgStats
            });
            if (trValues) {
                editor.Do(mkfActions.SetPropertyMultiple, {
                    target: variant.transformSettings,
                    values: trValues
                });
            }
        }

        glyph.CommitUpdate();
        this._Success();

    }

}

module.exports = CmdImportClipboard;