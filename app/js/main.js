
//"builds": "D:/wamp/www/SGF"

const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const ui = nkm.ui;

const mkfData = require(`./data`);
const mkfViews = require(`./views`);
const mkfEditors = require(`./editors`);
const mkfExplorers = require(`./explorers`);
const mkfOperations = require(`./operations`);

const Unicodes = require(`./unicodes`);
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

        /*
        mainShelf.nav.toolbar.CreateHandle({
            [com.IDS.NAME]: `Options`,
            [com.IDS.ICON]: `icon`,
            [ui.IDS.TRIGGER]: {
                fn: mainShelf.SetCurrentView,
                thisArg: mainShelf,
                arg: ui.UI.Rent(AppOptionsExplorer)
            }
        });
        */


        this._welcomeView = this.mainLayout.workspace.Host({
            [ui.IDS.VIEW_CLASS]: mkfViews.Welcome,
            [ui.IDS.NAME]: `Welcome`,
            [ui.IDS.ICON]: `visible`,
            [ui.IDS.STATIC]: true
        });

        this._editorView = this.mainLayout.workspace.Host({
            [ui.IDS.VIEW_CLASS]: mkfEditors.FontEditor,
            [ui.IDS.NAME]: `Font Editor`,
            [ui.IDS.ICON]: `visible`,
            [ui.IDS.STATIC]: true
        });

        this._tempFontData = new mkfData.Font();

        //Debug : load a bunch of icon starting at decimal
        this._iconFolder = `D:/GIT/nkmjs/packages/nkmjs-style/src-style/default/assets/icons`;
        this._ReadIconDir(null, fs.readdirSync(this._iconFolder));

        console.log(this._tempFontData);

        this._editorView.options.view.RequestDisplay();
        this._editorView.options.view.fontCatalog = Unicodes.instance._ranges;
        this._editorView.options.view.data = this._tempFontData;

    }

    _ReadIconDir(err, files) {
        console.log(files);

        let action = new mkfOperations.actions.SetSVG();
        let offset = 32;
        for (let i = 0; i < files.length; i++) {
            let filepath = files[i];
            if (!filepath.includes(`.svg`)) { continue; }
            let filecontent = fs.readFileSync(`${this._iconFolder}/${filepath}`, `utf8`);
            filecontent = mkfOperations.SVG.ProcessString(filecontent);
//            console.log(filepath, filecontent);
            let slot = Unicodes.instance._ranges.FindFirstByOptionValue(`decimal`, offset+i, true);

            action.Do({
                font: this._tempFontData,
                targetSlot: slot,
                svgString: filecontent
            }, false);
        }
    }

}

module.exports = MKFont;