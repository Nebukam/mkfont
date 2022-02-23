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
    static __default_footerClass = require(`./editor-font-footer`);

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

    set fontCatalog(p_catalog) {
        this._fontCatalog = p_catalog;
        this._viewport.catalog = p_catalog;
    }
    get fontCatalog() { return this._fontCatalog; }

    

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

    _PreprocessData(p_data) {
        if (!nkm.utils.isInstanceOf(p_data, mkfData.Family)) { return null; }
        return p_data;
    }
    
    _OnDataChanged(p_oldData){
        super._OnDataChanged(p_oldData);
        this._selectedSubFamily = this._data ? this._data.defaultSubFamily : null; // will self-update
    }

    _OnDataUpdated(p_data){
        super._OnDataUpdated(p_data);
        this.style.setProperty(`--glyph-color`, p_data.Get(mkfData.IDS.COLOR_PREVIEW));
    }

}

module.exports = FontEditor;
ui.Register(`mkfont-font-editor`, FontEditor);