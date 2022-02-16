const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const mkfViews = require(`../views`);

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

    }

    set fontCatalog(p_catalog){
        this._fontCatalog = p_catalog;
        this._viewport.catalog = p_catalog;
    }

    get fontCatalog(){ return this._fontCatalog; }

    _InitShelfCatalog(p_configList) {

        p_configList.push(
            {
                [ui.IDS.NAME]: `Font`,
                [ui.IDS.ICON]: `view-grid`,
                [ui.IDS.VIEW_CLASS]: this.constructor.__default_inspectorShellClass,
                assign: `_fontInspector`
            }
        );

        super._InitShelfCatalog(p_configList);

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
            },
            '.header':{
                'flex':'0 0 auto',
                'height':'150px',
                'background-color': 'rgba(150,150,150,0.1)'
            },
            '.main-view':{
                'width':'100%',
                'height':'100%'
            },
            '.inspector':{
                'min-width':'300px'
            }
        }, super._Style());
    }


}

module.exports = FontEditor;
ui.Register(`mkfont-font-editor`, FontEditor);