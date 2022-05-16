
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

        this._layers = [
            { id: `mainLayout`, cl: require(`./main-layout`) }
        ];

        nkm.documents.DOCUMENTS.Watch(nkm.data.SIGNAL.NO_ACTIVE_EDITOR, this._OnDocDataRoaming, this);

        this._prefDataObject = com.Rent(mkfData.Prefs);
        this._prefDataObject
            .Watch(mkfData.IDS_PREFS.AUTOSAVE, () => {
                nkm.documents.ToggleAutoSave(nkm.env.APP.PGet(mkfData.IDS_PREFS.AUTOSAVE));
            })
            .Watch(mkfData.IDS_PREFS.AUTOSAVE_TIMER, () => {
                nkm.documents.ToggleAutoSave(
                    nkm.env.APP.PGet(mkfData.IDS_PREFS.AUTOSAVE),
                    nkm.env.APP.PGet(mkfData.IDS_PREFS.AUTOSAVE_TIMER) * 1000 * 60);
            })

        this._defaultUserPreferences = {
            'mkf:prefs': JSON.stringify(nkm.data.serialization.JSONSerializer.Serialize(this._prefDataObject))
        };

    }

    _OnPrefsObjectUpdated(p_data) {
        //TODO : Stringify and set to prefs
        let json = nkm.data.serialization.JSONSerializer.Serialize(this._prefDataObject);
        this._userPreferences.Set(`mkf:prefs`, JSON.stringify(json));
    }

    _OnAppReadyInternal(p_data) {

        nkm.data.serialization.JSONSerializer.Deserialize(JSON.parse(p_data.Get(`mkf:prefs`)), this._prefDataObject);
        this._prefDataObject.Watch(com.SIGNAL.UPDATED, this._OnPrefsObjectUpdated, this);

        super._OnAppReadyInternal(p_data);
    }

    get mkfPrefs() { return this._prefDataObject; }
    PGet(p_id, p_fallback = null, p_fallbackIfNullValue = false) { return this._prefDataObject.Get(p_id, p_fallback, p_fallbackIfNullValue); }
    PSet(p_id, p_value, p_silent = false) { return this._prefDataObject.Set(p_id, p_value, p_silent); }

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

        this._mainCatalog = nkm.data.catalogs.CreateFrom({
            [com.IDS.NAME]: `MKF`
        }, [
            {
                [com.IDS.NAME]: `Main`,
                [com.IDS.ICON]: `view-list`,
                [ui.IDS.VIEW_CLASS]: mkfExplorers.MainExplorer
            }
        ]);


        let mainShelf = this.mainLayout.shelf;
        mainShelf.catalog = this._mainCatalog;
        mainShelf.RequestView(0);

        mainShelf.visible = false;


        this._welcomeView = this.mainLayout.workspace.Host({
            [ui.IDS.VIEW_CLASS]: mkfViews.Welcome,
            [ui.IDS.NAME]: `Home`,
            [ui.IDS.ICON]: `gear`,
            [ui.IDS.STATIC]: true
        });

        nkm.style.Set(`--glyph-color`, `#f5f5f5`);

        let openPath = null;
        // Check if ARGV contains an .mkfont file path
        searchloop: for (var p in nkm.env.ARGV) {
            if (p.includes(`.mkfont`)) {
                openPath = p;
                break searchloop;
            }
        }

        this.mainLayout.workspace._cells.ForEach((cell) => { cell._nav._cellOptionsBtn.trigger = { fn: () => { mkfCmds.OpenPrefs.Execute(); } } });

        this._welcomeView._options.view.RequestDisplay();
        this._OnOpenPathRequest(openPath);

        //this._EmptyFamily();
        //this._FamilyFromTTF();
        //mkfCmds.OpenPrefs.Execute();

    }

    _OnOpenPathRequest(p_path) {

        console.log(`_OnOpenPathRequest -> `, p_path);
        if (p_path == null || nkm.u.isVoid(p_path)) { return; }

        if (nkm.u.isArray(p_path)) {
            let finalPath = null;
            p_path.forEach((item) => { if (item.includes(`.mkfont`)) { finalPath = item; } });
            if (!finalPath) { return; }
            p_path = finalPath;
        }

        if (!p_path.includes(`.mkfont`)) { return; }

        mkfCmds.LoadFamilyDoc.Execute(p_path);

    }

    _OnDocDataRoaming(p_document) {
        mkfCmds.ReleaseFamilyDoc.Execute(p_document.currentData);
    }

    _EmptyFamily() {

        mkfCmds.CreateFamilyDoc.Execute();

    }

    _FamilyFromTTF() {

        let family = mkfData.TTF.FamilyFromTTF(fs.readFileSync(`./assets-dev/ttfs/${__fontName}.ttf`));

        let gCount = family._glyphs.count;
        family._glyphs.ForEach(glyph => {
            for (let i = 0; i < 5; i++) {

                if (Math.random() > 0.2) { continue; }

                let
                    newLayer = nkm.com.Rent(mkfData.GlyphLayer),
                    g = family._glyphs.At(Math.round(Math.random() * (gCount - 1)));

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

        let outputStr = JSON.stringify(nkm.data.serialization.JSONSerializer.Serialize(this._tempFontData));
        //console.log(JSON.parse(outputStr));

        this._anotherFamily = nkm.data.serialization.JSONSerializer.Deserialize(JSON.parse(outputStr));
        //console.log(this._anotherFamily);

    }

}

module.exports = MKFont;