
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

const __fontName = `Basement-Medium`;// `Basement-Medium`;// `Meticula`; //`Inter-Regular`

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

        ui.Preload(mkfWidgets.GlyphSlot, 300);
        ui.Preload(mkfWidgets.LigaButton, 300);
        //ui.Preload(mkfEditors.FontEditor, 3);
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

        nkm.style.Set(`--glyph-color`, `#f5f5f5`);

        let openPath = null;
        // Check if ARGV contains an .mkfont file path
        searchloop: for (var p in nkm.env.ARGV) {
            if (p.includes(`.mkfont`)) {
                openPath = p;
                break searchloop;
            }
        }

        if(openPath != null && !nkm.utils.isVoid(openPath)){
            mkfOperations.commands.IOLoadFamily.Execute(openPath);
        }else{
            this._welcomeView._options.view.RequestDisplay();
        }

        //mkfOperations.commands.MakeTTFFont.Enable();
        //nkm.actions.KeystrokeEx.CreateFromString(`Ctrl E`, { fn: this._Bind(this._WriteTTF) }).Enable();

        //this._EmptyFamily();
        //this._FamilyFromTTF();

    }

    _EmptyFamily() {

        mkfOperations.commands.StartNewMKFont.Execute();

    }

    _FamilyFromTTF() {

        let family = mkfData.TTF.FamilyFromTTF(fs.readFileSync(`./assets/${__fontName}.ttf`));
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

    _WriteTTF() {
        mkfOperations.commands.MakeTTFFont.Execute(this._tempFontData);
    }

}

module.exports = MKFont;