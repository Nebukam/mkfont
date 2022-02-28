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
                [ui.IDS.ICON]: `three-lines`,
                [ui.IDS.VIEW_CLASS]: mkfInspectors.FamilyContent,
                assign: `_contentInspector`
            },
            {
                [ui.IDS.NAME]: `Inspector`,
                [ui.IDS.ICON]: `text`,
                [ui.IDS.VIEW_CLASS]: this.constructor.__default_inspectorShellClass,
                assign: `_inspectorShell`
            },

        );

    }

    _PostInit(){
        super._PostInit();
        this._contentInspector.RequestDisplay();
    }

    set fontCatalog(p_catalog) {
        this._fontCatalog = p_catalog;
        this._viewport.catalog = p_catalog;
    }
    get fontCatalog() { return this._fontCatalog; }

    set selectedSubFamily(p_value) {
        if (this._selectedSubFamily == p_value) { return; }
        let old = this._selectedSubFamily;
        this._selectedSubFamily = p_value;
        if (old) { old.Unwatch(nkm.data.SIGNAL.VALUE_CHANGED, this._OnValueChanged, this); }
        if (p_value) { p_value.Watch(nkm.data.SIGNAL.VALUE_CHANGED, this._OnValueChanged, this); }
    }

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
        ui.dom.AttachFirst(this._pangramInspector, this._body, false);
        this._dataControllers.Add(this._pangramInspector);
    }

    _PreprocessData(p_data) {
        if (!nkm.utils.isInstanceOf(p_data, mkfData.Family)) { return null; }
        return p_data;
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);

        if (this._data) {
            this.selectedSubFamily = this._data.defaultSubFamily;
            this.fontCatalog = this._data.catalog;
            this._OnValueChanged(this._data, mkfData.IDS.PREVIEW_SIZE, null);
        } else {
            this.selectedSubFamily = null;
            this.fontCatalog = null;
        }
    }

    _OnValueChanged(p_data, p_id, p_valueObj) {

        let infos = mkfData.IDS.infos[p_id];
        if (!infos) { return; }

        if (infos.recompute) {

            let subFam = this._selectedSubFamily;

            subFam._UpdateDisplayValues();

            let s = subFam.Resolve(mkfData.IDS.PREVIEW_SIZE),
                rW = subFam._previewInfos.raw,
                rH = subFam._previewInfos.rah,
                pH = `auto`,
                pW = `auto`;

            if (rW > rH) {
                //Wider than taller
                pH = `${s}px`;
            } else {
                //Taller than wider
                pW = `${s}px`;
            }

            nkm.style.Set(`--glyph-color`, p_data.Resolve(mkfData.IDS.COLOR_PREVIEW));
            nkm.style.Set(`--preview-size`, `${s}px`);
            nkm.style.Set(`--preview-height`, `${pH}`);
            nkm.style.Set(`--preview-width`, `${pW}`);
            nkm.style.Set(`--preview-ratio`, `${rW}/${rH}`);

        }
    }

}

module.exports = FontEditor;
ui.Register(`mkfont-font-editor`, FontEditor);