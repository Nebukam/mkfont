const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const UNICODE = require(`../unicode`);
const SIGNAL = require(`../signal`);

const mkfInspectors = require(`./inspectors`);
const mkfViewports = require(`./viewports`);
const mkfViews = require(`../views`);
const mkfData = require(`../data`);

class FontEditor extends nkm.uiworkspace.editors.EditorEx {
    constructor() { super(); }

    static __default_viewportClass = mkfViewports.GlyphGroupViewport;
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

        this._leftShelfList = [];
        this._leftShelfCatalog = new nkm.data.catalogs.Catalog(false);

        this._selectedSubFamily = null;
        this._pangramInspector = null;

        //const ContentUpdater = require(`../content-updater`);
        this._dataObserver
            .Hook(nkm.com.SIGNAL.VALUE_CHANGED, this._OnDataValueChanged, this)
            .Hook(SIGNAL.GLYPH_ADDED, this._OnGlyphAdded, this)
            .Hook(SIGNAL.GLYPH_REMOVED, this._OnGlyphRemoved, this);

        this._dataPreProcessor = (p_owner, p_data) => {
            return u.isInstanceOf(p_data, mkfData.Family) ? p_data : null;
        };

    }

    _PostInit(){
        super._PostInit();
        this._actionStackInspector.data = this._actionStack;
        console.log(this._actionStackInspector.data);
    }

    _InitShelfCatalog(p_configList) {

        p_configList.push(
            {
                [ui.IDS.NAME]: `Inspector`,
                [ui.IDS.ICON]: `text`,
                [ui.IDS.VIEW_CLASS]: this.constructor.__default_inspectorShellClass,
                assign: `_inspectorShell`
            },

        );

        this._leftShelfList.push(
            {
                [ui.IDS.NAME]: `Unicode`,
                [ui.IDS.ICON]: `text-style`,
                [ui.IDS.VIEW_CLASS]: mkfInspectors.FamilyContent,
                assign: `_contentInspector`
            },
            {
                [ui.IDS.NAME]: `Pangram`,
                [ui.IDS.ICON]: `text`,
                [ui.IDS.VIEW_CLASS]: mkfInspectors.Pangram,
                assign: `_pangramInspector`
            },
            {
                [ui.IDS.NAME]: `History`,
                [ui.IDS.ICON]: `refresh`,
                [ui.IDS.VIEW_CLASS]: nkm.uiworkspace.inspectors.ActionStack,
                assign: `_actionStackInspector`,
                [ui.IDS.DATA]: this._actionStack,
                ignoreData:true
            }
        );

    }

    _RegisterEditorBits() {

        super._RegisterEditorBits();

        this._leftShelf.catalog = this._leftShelfCatalog;

        let confs = this._leftShelfList;

        for (let i = 0, n = confs.length; i < n; i++) {

            let
                conf = confs[i],
                item = this._leftShelfCatalog.Register(conf),
                view = item.GetOption('view', null),
                assign = u.tils.Get(conf, `assign`, null);

            if (view) {
                if (conf.isInspector) { this.forwardInspected.To(view); }
                else if(!conf.ignoreData){ this.forwardData.To(view); }
                if (assign) { this[assign] = view; }
            }

        }

    }

    _OnSelectionStackItemAdded(p_widget) {
        let glyphInfos = p_widget.glyphInfos;
        if (glyphInfos) {
            let glyph = p_widget.data;
            if (glyph) {
                // Has an existing glyph!
                if (glyph.isNull) {
                    glyph.unicodeInfos = glyphInfos;
                    //glyph.subFamily
                    glyph.CommitUpdate();//Ensure the data gets refreshed, since it hasn't changed.
                    glyph.defaultGlyph.CommitUpdate();
                }
                this.Inspect(glyph);
            } else {
                // No glyph associated... at all??
                console.error(`Edge case, find why`);
                this.Inspect(null);
            }
        } else {
            this.Inspect(null);
        }
    }

    _OnSelectionStackItemRemoved(p_widget) {
        //if (this._inspectedData == p_widget.data) { this.Inspect(null); }
    }

    _PostInit() {
        super._PostInit();
        this._contentInspector.RequestDisplay();
        this._pangramInspector.RequestDisplay();

        this._inspectorShell.header.style.display = `none`;
        this._shelf._nav.visible = false;

        this.Inspect(null);

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
        if (old) { old.Unwatch(nkm.data.SIGNAL.VALUE_CHANGED, this._OnDataValueChanged, this); }
        if (p_value) { p_value.Watch(nkm.data.SIGNAL.VALUE_CHANGED, this._OnDataValueChanged, this); }
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

        this._leftShelf = this.Add(this.constructor.__default_shelfClass, `shelf`, this._body);
        this._leftShelf.orientation = ui.FLAGS.VERTICAL;
        this._leftShelf.navPlacement = ui.FLAGS.LEFT;

        this._shelf.orientation = ui.FLAGS.HORIZONTAL;
        this._shelf.navPlacement = ui.FLAGS.TOP;

        ui.dom.AttachFirst(this._leftShelf, this._body, false);

    }

    SetActiveRange(p_rangeData) {
        this._viewport.displayRange = p_rangeData ? p_rangeData.options : null;
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);

        if (this._data) {
            this.selectedSubFamily = this._data.defaultSubFamily;
            this.fontCatalog = this._data.catalog;
            this._OnDataValueChanged(this._data, mkfData.IDS.PREVIEW_SIZE, null);
        } else {
            this.selectedSubFamily = null;
            this.fontCatalog = null;
        }
    }

    _OnDataValueChanged(p_data, p_id, p_valueObj) {

        let infos = mkfData.IDS.GetInfos(p_id);
        console.log(infos);
        if (!infos) { return; }

        if (infos.recompute) {

            let subFam = this._selectedSubFamily;

            subFam._UpdateDisplayValues();

            let s = subFam.Resolve(mkfData.IDS.PREVIEW_SIZE),
                rW = subFam._contextInfos.raw,
                rH = subFam._contextInfos.rah,
                pH = `auto`,
                pW = `auto`,
                fH = s, fW = s;

            if (rW > rH) {
                //Wider than taller
                pH = `${s}px`;
                fH = s;
                fW = s * rW;
            } else {
                //Taller than wider
                pW = `${s}px`;
                fH = s * rH;
                fW = s;
            }

            nkm.style.Set(`--glyph-color`, p_data.Resolve(mkfData.IDS.COLOR_PREVIEW));
            nkm.style.Set(`--preview-size`, `${s}px`);
            nkm.style.Set(`--preview-height`, `${fH * 0.8}px`);
            nkm.style.Set(`--preview-width`, `${fW * 0.8}px`);
            nkm.style.Set(`--preview-ratio`, `${rW}/${rH}`);

            this._viewport.SetPreviewSize(fW, fH);

        }
    }

    _OnGlyphAdded(p_family, p_glyph) {
        if (this._inspectedData) {
            if (this._inspectedData.unicodeInfos == p_glyph.unicodeInfos) {
                this.Inspect(p_glyph);
            }
        }
    }

    _OnGlyphRemoved(p_family, p_glyph) {
        console.log(`glyph removed`, p_glyph, this._inspectedData);
        if (this._inspectedData == p_glyph) {
            p_family.nullGlyph.unicodeInfos = p_glyph.unicodeInfos;
            this.Inspect(p_family.nullGlyph);
        }
    }

}

module.exports = FontEditor;
ui.Register(`mkfont-font-editor`, FontEditor);