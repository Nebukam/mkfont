
//"builds": "D:/wamp/www/SGF"

const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const ui = nkm.ui;

com.BINDINGS.Expand(require(`./bindings`)); //!important

const mkfData = require(`./data`);
const mkfViews = require(`./views`);
const mkfEditors = require(`./editors`);
const mkfExplorers = require(`./explorers`);
const mkfOperations = require(`./operations`);
const mkfCmds = mkfOperations.commands;
const mkfWidgets = require(`./widgets`);

const UNICODE = require(`./unicode`);
const fs = require('fs');

const __fontName = `Meticula`;// `Basement-Medium`;// `Meticula`; //`Inter-Regular`

/**
 * SteamGameFinder allows you to find which multiplayer games are shared within a group of steam users
 */
class MKFont extends nkm.app.AppBase {

    constructor() { super(); }

    _Init() {
        super._Init();

        this._appSettingsType = mkfData.AppSettings; 

        this._layers = [
            { id: `mainLayout`, cl: nkm.uiworkspace.WorkspaceRoot }
        ];
        
        this._MKFontDocDefinition = this._RegisterDocDefinition(
            { name: `MKFONT Files`, extensions: [`mkfont`] },
            { dataType: mkfData.Family, docType:nkm.documents.bound.JSONDocument },
            mkfEditors.FontEditor
        );
        this._MKFontDocDefinition.bumpOnly = true;

    }

    AppReady() {
        /*
                ui.Preload(mkfWidgets.GlyphSlot, 50);
                ui.Preload(mkfWidgets.LigaButton, 50);
                ui.Preload(mkfWidgets.LayerControl, 50);
                ui.Preload(mkfWidgets.LayerControlSilent, 50);
        */
        super.AppReady();

        let cols = {
            default: `#000`,
            letter: `#00ff96`,
            mark: `#ffea00`,
            number: `#00a2ff`,
            separator: `#686868`,
            control: `#ff0000`,
            other: `#c5c5c5`,
            modifier: `#ff0898`,
            punctuation: `#a77415`,
            symbol: `#4d638e`,
            ligature: `#8aff00`,
        };

        for (var p in cols) { nkm.style.Set(`--col-${p}`, cols[p]); }

        this._welcomeView = this.mainLayout.Host({
            [ui.IDS.VIEW_CLASS]: mkfViews.Welcome,
            [ui.IDS.NAME]: `Home`,
            [ui.IDS.ICON]: `gear`,
            [ui.IDS.STATIC]: true
        });

        nkm.style.Set(`--glyph-color`, `#f5f5f5`);

        this.mainLayout._cells.forEach((cell) => { cell._nav._cellOptionsBtn.trigger = { fn: () => { mkfCmds.OpenPrefs.Execute(); } } });

        this._welcomeView._options.view.RequestDisplay();

        //this._EmptyFamily();
        //this._FamilyFromTTF();
        //mkfCmds.OpenPrefs.Execute();

    }

    _EmptyFamily() {

        mkfCmds.CreateFamilyDoc.Execute();

    }

    _FamilyFromTTF() {

        let family = mkfData.TTF.FamilyFromTTF(fs.readFileSync(`./assets-dev/ttfs/${__fontName}.ttf`));

        let gCount = family._glyphs.length;
        family._glyphs.forEach(glyph => {
            for (let i = 0; i < 5; i++) {

                if (Math.random() > 0.2) { continue; }

                let
                    newLayer = nkm.com.Rent(mkfData.GlyphLayer),
                    g = family._glyphs[Math.round(Math.random() * (gCount - 1))];

                glyph.activeVariant.AddLayer(newLayer);
                newLayer.expanded = false;
                newLayer.Set(mkfData.IDS.LYR_CHARACTER_NAME, g.unicodeInfos.char);

            }
        });

        nkm.actions.Emit(nkm.actions.REQUEST.EDIT, { data: family },
            this, this._Success, this._Fail);

    }

    _AssignFamily(p_family) {

        let fontEditor = this._editorView.options.view;
        fontEditor.RequestDisplay();
        fontEditor.data = this._tempFontData;

        let outputStr = JSON.stringify(nkm.data.s11n.JSONSerializer.Serialize(this._tempFontData));
        //console.log(JSON.parse(outputStr));

        this._anotherFamily = nkm.data.s11n.JSONSerializer.Deserialize(JSON.parse(outputStr));
        //console.log(this._anotherFamily);

    }

}

module.exports = MKFont;