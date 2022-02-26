
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

const SET_SVG = new mkfOperations.actions.SetSVG();

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

        mainShelf.visible = false;

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
            [ui.IDS.NAME]: `Family Editor`,
            [ui.IDS.ICON]: `visible`,
            [ui.IDS.STATIC]: true
        });

        this._tempFontData = new mkfData.Family();

        //Debug : load a bunch of icon starting at decimal

        this._iconFolder = `D:/GIT/nkmjs/packages/nkmjs-style/src-style/default/assets/icons`;
        //this._ReadIconDir(null, fs.readdirSync(this._iconFolder));

        //this._ReadTTF();

        let test = Unicodes.instance._ranges;
        /*
                let checkerSVG = fs.readFileSync(`./assets/checker.svg`); //D:/GIT/mkfont
                for (let i = 0; i < 255; i++) {
                    this._PushSVG(this._tempFontData, checkerSVG, i);
                }
        */

        //        console.log(this._tempFontData);

        let fName = `Basement-Medium`;// `Basement-Medium`;// `Meticula`; //`Inter-Regular`;
        this._tempFontData = mkfOperations.SVG.FamilyFromTTF(fs.readFileSync(`./assets/${fName}.ttf`));

        mkfOperations.commands.MakeTTFFont.Enable();

        nkm.actions.KeystrokeEx.CreateFromString(`Ctrl E`, { fn: this._Bind(this._WriteTTF) }).Enable();
        
        let t0 = performance.now();
        
        this._editorView.options.view.RequestDisplay();
        this._editorView.options.view.data = this._tempFontData;

        let t1 = performance.now();

        console.log(`took ${t1 - t0}ms`);

    }

    _WriteTTF() {
        mkfOperations.commands.MakeTTFFont.Execute(this._tempFontData);
    }

    _ReadIconDir(err, files) {
        console.log(files);

        let offset = 48;
        for (let i = 0; i < files.length; i++) {
            let filepath = files[i];
            if (!filepath.includes(`.svg`)) { continue; }
            let svg = fs.readFileSync(`${this._iconFolder}/${filepath}`, `utf8`);
            this._PushSVG(this._tempFontData, svg, offset + i);
        }
    }

    _PushSVG(p_family, p_svgString, i) {
        let svg = mkfOperations.SVG.ProcessString(p_svgString);
        //            console.log(filepath, filecontent);
        let slot = Unicodes.instance._ranges.FindFirstByOptionValue(`glyph`, String.fromCharCode(i), true);
        if (!slot) { return; }
        SET_SVG.Do({
            family: p_family,
            slot: slot,
            svg: svg,
            unicode: String.fromCharCode(i)
        }, false);
    }

    _ReadTTF() {
        
        let ttf = fs.readFileSync('./assets/Inter-Regular.ttf');

        var svgContent = ttf2svg(ttf);
        console.log(svgContent);
        var D = new DOMParser();
        var svg = D.parseFromString(svgContent, `image/svg+xml`);

        // Read size of font

        var glyphs = svg.getElementsByTagName(`glyph`);
        console.log(`There's, like, ${glyphs.length} glyphs.`);
        for (let i = 0; i < glyphs.length; i++) {
            let g = glyphs[i],
                uni = g.getAttribute(`unicode`),
                path = g.getAttribute(`d`);
            this._PushSVG(this._tempFontData, `<svg xmlns="http://www.w3.org/2000/svg"><path d="${path}"></path></svg>`, i);
        }

    }

}

module.exports = MKFont;