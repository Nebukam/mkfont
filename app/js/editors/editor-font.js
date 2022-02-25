const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const mkfInspectors = require(`./inspectors`);
const mkfViewports = require(`./viewports`);
const mkfViews = require(`../views`);
const mkfData = require(`../data`);

class FontEditor extends nkm.uiworkspace.editors.EditorEx {
    constructor() { super(); }

    static __default_viewportClass = mkfViewports.GlyphGroupViewport;
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
        this._pangramInspector = null;

        this._dataObserver.Hook(nkm.data.SIGNAL.VALUE_CHANGED, this._OnValueChanged, this);

    }

    _InitShelfCatalog(p_configList) {
        p_configList.push(
            {
                [ui.IDS.NAME]: `Inspector`,
                [ui.IDS.ICON]: `icon`,
                [ui.IDS.VIEW_CLASS]: this.constructor.__default_inspectorShellClass,
                assign: `_inspectorShell`
            }
        );
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
                '--glyph-stroke-color': 'red'
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

    _Render() {
        super._Render();
        this._pangramInspector = this.Add(mkfInspectors.Pangram, `pangram`, this._body);
        this._dataControllers.Add(this._pangramInspector);
    }

    _PreprocessData(p_data) {
        if (!nkm.utils.isInstanceOf(p_data, mkfData.Family)) { return null; }
        return p_data;
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        this._selectedSubFamily = this._data ? this._data.defaultSubFamily : null; // will self-update
        if (this._data) {
            this._OnValueChanged(this._data, mkfData.IDS.PREVIEW_SIZE, null);
        }
    }

    _OnValueChanged(p_data, p_id, p_valueObj) {

        if (p_id == mkfData.IDS.COLOR_PREVIEW ||
            p_id == mkfData.IDS.PREVIEW_SIZE ||
            p_id == mkfData.IDS.RATIO_H ||
            p_id == mkfData.IDS.RATIO_V) {
                
            let s = p_data.Get(mkfData.IDS.PREVIEW_SIZE),
                rH = p_data.Get(mkfData.IDS.RATIO_H),
                rV = p_data.Get(mkfData.IDS.RATIO_V),
                pH = `auto`,
                pW = `auto`;

            if (rH > rV) {
                pH = `${s}px`;
            } else {
                pW = `${s}px`;
            }

            nkm.style.Set(`--glyph-color`, p_data.Get(mkfData.IDS.COLOR_PREVIEW));
            nkm.style.Set(`--preview-size`, `${s}px`);
            nkm.style.Set(`--preview-height`, `${pH}`);
            nkm.style.Set(`--preview-width`, `${pW}`);
            nkm.style.Set(`--preview-ratio`, `${rH}/${rV}`);

        }
    }

}

module.exports = FontEditor;
ui.Register(`mkfont-font-editor`, FontEditor);