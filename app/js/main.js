
//"builds": "D:/wamp/www/SGF"

const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const ui = nkm.ui;

const mkfData = require(`./data`);
const mkfViews = require(`./views`);
const mkfEditors = require(`./editors`);
const mkfExplorers = require(`./explorers`);
const mkfOperations = require(`./operations`);

const UNICODE = require(`./unicode`);
const fs = require('fs');

com.BINDINGS.Expand(require(`./bindings`)); //!important

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

    }

    AppReady() {

        super.AppReady();

        nkm.style.Set(`--col-default`, `#000`);
        nkm.style.Set(`--col-letter`, `#00ff96`);
        nkm.style.Set(`--col-mark`, `#ffea00`);
        nkm.style.Set(`--col-number`, `#00a2ff`);
        nkm.style.Set(`--col-separator`, `#ba00ff`);
        nkm.style.Set(`--col-control`, `#ff0000`);
        nkm.style.Set(`--col-other`, `#c5c5c5`);
        nkm.style.Set(`--col-modifier`, `#7259a6`);
        nkm.style.Set(`--col-punctuation`, `#a6932d`);
        nkm.style.Set(`--col-symbol`, `#4d638e`);
        nkm.style.Set(`--col-ligature`, `#72d300`);

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

        this._tempFontData = new mkfData.Family();

        this._iconFolder = `D:/GIT/nkmjs/packages/nkmjs-style/src-style/default/assets/icons`;

        let fName = `Inter-Regular`;// `Basement-Medium`;// `Meticula`; //`Inter-Regular`;
        this._tempFontData = mkfData.TTF.FamilyFromTTF(fs.readFileSync(`./assets/${fName}.ttf`));

        mkfOperations.commands.MakeTTFFont.Enable();

        nkm.actions.KeystrokeEx.CreateFromString(`Ctrl E`, { fn: this._Bind(this._WriteTTF) }).Enable();

        let fontEditor = this._editorView.options.view;

        fontEditor.RequestDisplay();
        fontEditor.data = this._tempFontData;
        fontEditor.SetActiveRange(UNICODE.instance._blockCatalog.At(0));

        //this._TestImportPopup();
        console.log(JSON.stringify(nkm.data.serialization.JSONSerializer.Serialize(this._tempFontData)));

    }

    _WriteTTF() {
        mkfOperations.commands.MakeTTFFont.Execute(this._tempFontData);
    }

    _TestImportPopup(){

        let iInspector = nkm.ui.UI.Rent(`mkfont-single-tr-preview`);

        nkm.dialog.Push({
            title: `Import tweaks`,
            message: `Tweak the imported data to make sure it fits!`,
            content: [{ cl: iInspector, donotrelease: true }],
            actions: [
                { label: `Looks good`, flavor: nkm.com.FLAGS.READY, variant: nkm.ui.FLAGS.FRAME },
                { label: `Cancel`, trigger: { fn: this._Cancel, thisArg: this } }
            ],
            origin: this,
        });
    }

}

module.exports = MKFont;