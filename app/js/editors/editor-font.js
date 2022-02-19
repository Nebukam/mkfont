const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const mkfInspectors = require(`./inspectors`);
const mkfViews = require(`../views`);
const mkfData = require(`../data`);

class FontEditor extends nkm.uiworkspace.editors.EditorEx {
    constructor() { super(); }

    static __default_viewportClass = mkfViews.GlyphGroupViewport;
    static __default_headerClass = require(`./editor-font-header`);
    //static __default_footerClass = require(`./editor-font-footer`);

    _Init() {
        super._Init();

        // FontEditor receives a Glyph Data Block to work with
        // it is responsible for creating and maintaining catalogs
        // that will be fed to GlyphGridGroups
        // according to which data they belong to.

        // However, Helper functions to do the search & match should reside
        // somewhere else

        this._selectedSubFamily = null;

    }

    _InitShelfCatalog(p_configList) {

        p_configList.push(
            {
                [ui.IDS.NAME]: `View`,
                [ui.IDS.ICON]: `visible`,
                [ui.IDS.VIEW_CLASS]: mkfInspectors.Family,
                assign: `_glyphExplorer`
            },
            {
                [ui.IDS.NAME]: `Family`,
                [ui.IDS.ICON]: `view-grid`,
                [ui.IDS.VIEW_CLASS]: mkfInspectors.SubFamily,
                assign: `_familyInspector`
            }
        );

        super._InitShelfCatalog(p_configList);

    }

    set fontCatalog(p_catalog) {
        this._fontCatalog = p_catalog;
        this._viewport.catalog = p_catalog;
    }

    get fontCatalog() { return this._fontCatalog; }

    _PostInit() {
        super._PostInit();
        this._glyphExplorer.editor = this;

        //this._shelf.order = -1;
        //this._shelf.orientation = ui.FLAGS.VERTICAL;
        //this._shelf.navPlacement = ui.FLAGS.LEFT;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                '--glyph-color': '#f5f5f5',
                '--glyph-stroke-color': 'red',
                '--preview-ratio': '2/1'
            },
            '.main-view': {
                'width': '100%',
                'height': '100%'
            },
            '.inspector': {
                'min-width': '250px'
            }
        }, super._Style());
    }
    
    _OnDataChanged(p_oldData){
        super._OnDataChanged(p_oldData);
        this.selectedSubFamily = this._data ? this._data.defaultSubFamily : null; // will self-update
        this._glyphExplorer.data = this._data;
        this._familyInspector.data = this._data;
    }

}

module.exports = FontEditor;
ui.Register(`mkfont-font-editor`, FontEditor);