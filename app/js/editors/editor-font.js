const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const EditorFontHeader = require(`./editor-font-header`);

class FontEditor extends nkm.uiworkspace.editors.EditorEx {
    constructor() { super(); }

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
    }

    get fontCatalog(){ return this._fontCatalog; }

    _Style() {
        return nkm.style.Extends({
            ':host': {

            }
        }, super._Style());
    }

    _Render(){
        super._Render();
        this._editorHeader = this.Add(EditorFontHeader, "editor-header", this._header);
        this._shelf.visible = false;
    }



}

module.exports = FontEditor;
ui.Register(`mkfont-font-editor`, FontEditor);