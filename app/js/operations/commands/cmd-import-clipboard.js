//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

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

        if (nkm.ui.dom.isTextHighlighted || !this._emitter) {
            this._Cancel();
            return;
        }

        let
            editor = nkm.datacontrols.FindEditor(this._emitter),
            family = editor.data,
            variant = family.GetGlyph(this._context?.u || editor.inspectedData.lastItem?.u).GetVariant(family.selectedSubFamily),
            svgStats = { exists: false },
            svgString = clipboard.readText();

        console.log(`active editor : ${editor} | ${family}`);

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
            glyph = variant.glyph,
            trValues = variant._transformSettings.Values(),
            unicodeInfos;

        SVGOPS.TryGetTRValues(trValues, svgString);

        console.log(trValues);

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