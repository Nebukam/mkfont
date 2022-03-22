
//"builds": "D:/wamp/www/SGF"

const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const ui = nkm.ui;

const mkfData = require(`./data`);
const mkfViews = require(`./views`);
const mkfEditors = require(`./editors`);
const mkfExplorers = require(`./explorers`);
const mkfOperations = require(`./operations`);
const mkfWidgets = require(`./widgets`);

const UNICODE = require(`./unicode`);
const fs = require('fs');

com.BINDINGS.Expand(require(`./bindings`)); //!important

const __fontName = `Inter-Regular`;// `Basement-Medium`;// `Meticula`; //`Inter-Regular`

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

        ui.UI.instance._Preload(mkfWidgets.GlyphSlot, 300);        
    }

    AppReady() {

        super.AppReady();

        let cols = {
            default: `#000`,
            letter: `#00ff96`,
            mark: `#ffea00`,
            number: `#00a2ff`,
            separator: `#ba00ff`,
            control: `#ff0000`,
            other: `#c5c5c5`,
            modifier: `#7259a6`,
            punctuation: `#a6932d`,
            symbol: `#4d638e`,
            ligature: `#72d300`,
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

        this._editorView = this.mainLayout.workspace.Host({
            [ui.IDS.VIEW_CLASS]: mkfEditors.FontEditor,
            [ui.IDS.NAME]: `Family Editor`,
            [ui.IDS.ICON]: `font`,
            [ui.IDS.STATIC]: true
        });

        this._welcomeView._options.view.RequestDisplay();

        //mkfOperations.commands.MakeTTFFont.Enable();
        //nkm.actions.KeystrokeEx.CreateFromString(`Ctrl E`, { fn: this._Bind(this._WriteTTF) }).Enable();

        //this._EmptyFamily();
        //this._FamilyFromTTF();

    }

    _EmptyFamily() {
        this._tempFontData = new mkfData.Family();
        this._AssignFamily(this._tempFontData);
    }

    _FamilyFromTTF() {
        this._tempFontData = new mkfData.Family();
        this._tempFontData = mkfData.TTF.FamilyFromTTF(fs.readFileSync(`./assets/${__fontName}.ttf`));
        this._AssignFamily(this._tempFontData);
    }

    _AssignFamily(p_family) {

        let fontEditor = this._editorView.options.view;
        fontEditor.RequestDisplay();
        fontEditor.data = this._tempFontData;

        fontEditor.SetActiveRange(UNICODE.instance._blockCatalog.At(0));

        //console.log(JSON.stringify(nkm.data.serialization.JSONSerializer.Serialize(this._tempFontData)));

    }

    _WriteTTF() {
        mkfOperations.commands.MakeTTFFont.Execute(this._tempFontData);
    }

}

module.exports = MKFont;