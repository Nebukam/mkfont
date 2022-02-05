
//"builds": "D:/wamp/www/SGF"

const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const ui = nkm.ui;

const mkfViews = require(`./views`);
const mkfEditors = require(`./editors`);
const mkfExplorers = require(`./explorers`);

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

        this._editorView.options.view.RequestDisplay();
        this._editorView.options.view.fontCatalog = this.BuildDebugFontCatalog();

    }

    BuildDebugFontCatalog(){

        let groups = [];

        for(let i = 0; i < 10; i++){
            let group = { content:[], name:`group_${i}` };
            for(let j = 0; j < 10; j++){
                group.content.push({ name:`item_${i}_${j}` });
            }
            groups.push(group);
        }
        let rootObject = { name:`Font Catalog` };

        let rootCatalog = nkm.data.catalogs.CreateFrom(rootObject, groups);
        console.log(rootCatalog);
        return rootCatalog;

    }

}

module.exports = MKFont;