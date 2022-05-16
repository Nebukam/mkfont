'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const UNICODE = require(`../unicode`);
const SIGNAL = require(`../signal`);

const mkfInspectors = require(`./inspectors`);
const mkfViewports = require(`./viewports`);
const mkfViews = require(`../views`);
const mkfData = require(`../data`);
const mkfOperations = require(`../operations`);
const mkfCmds = mkfOperations.commands;

const helpers = require(`./helpers`);

const base = nkm.uiworkspace.editors.EditorEx;
class FontEditor extends base {
    constructor() { super(); }

    static __registerableEditor = true;

    static __default_viewportClass = mkfViewports.GlyphGroup;
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

        this._Bind(this._ConfirmClose);

        this._pangramViewport = null;

        this._leftShelfList = [];
        this._leftShelfCatalog = new nkm.data.catalogs.Catalog(false);

        this._pangramInspector = null;

        //const ContentManager = require(`../content-manager`);
        this._dataObserver
            .Hook(nkm.com.SIGNAL.VALUE_CHANGED, this._OnDataValueChanged, this)
            .Hook(SIGNAL.GLYPH_ADDED, this._OnGlyphAdded, this)
            .Hook(SIGNAL.GLYPH_REMOVED, this._OnGlyphRemoved, this);

        this._dataPreProcessor = (p_owner, p_data) => {
            return u.isInstanceOf(p_data, mkfData.Family) ? p_data : null;
        };

        this._inspectedData.SetupAnalytics(
            {
                nullGlyphs: 0, existingGlyphs: 0,
                existing: [], uuni: ``, existingInfos: []
            },
            { fn: this._AnalyizeGlyphInfos, thisArg: this },
            {
                fn: (an) => {
                    an.nullGlyphs = 0; an.existingGlyphs = 0;
                    an.existing.length = 0; an.uuni = ``;
                    an.existingInfos.length = 0;
                }
            },
        );
        this._inspectedData.invalidateAnalyticsOnBump = true;

        this._bindingManager = new helpers.BindingManager(this);

        // Commands
        this.cmdSave = this._commands.Add(mkfCmds.SaveFamilyDoc, { shortcut: this.shortcuts.Create("Ctrl S") });
        this.cmdExport = this._commands.Create(mkfCmds.ExportTTF, { shortcut: this.shortcuts.Create("Ctrl E") });
        this.cmdEditInPlace = this._commands.Create(mkfCmds.EditInExternalEditor);

        this.cmdGlyphClear = this._commands.Create(mkfCmds.GlyphClear);
        this.cmdGlyphDelete = this._commands.Create(mkfCmds.GlyphDelete, { shortcut: this.shortcuts.Create("Delete").Strict() });
        this.cmdGlyphCopy = this._commands.Create(mkfCmds.GlyphCopy, { shortcut: this.shortcuts.Create("Ctrl C").Strict() });
        this.cmdGlyphPaste = this._commands.Create(mkfCmds.GlyphPaste, { shortcut: this.shortcuts.Create("Ctrl V").Strict() });
        this.cmdGlyphPasteInPlace = this._commands.Create(mkfCmds.GlyphPasteInPlace, { shortcut: this.shortcuts.Create("Ctrl Shift V").Strict() });
        this.cmdGlyphPasteTransform = this._commands.Create(mkfCmds.GlyphPasteTransform, { shortcut: this.shortcuts.Create("Ctrl Alt V").Strict() });

        this.cmdLayerAdd = this._commands.Create(mkfCmds.LayerAdd);
        this.cmdLayersAddUInfos = this._commands.Create(mkfCmds.LayersAddUInfos);
        this.cmdLayerRemove = this._commands.Create(mkfCmds.LayerRemove);
        this.cmdLayerUp = this._commands.Create(mkfCmds.LayerUp);
        this.cmdLayerDown = this._commands.Create(mkfCmds.LayerDown);
        this.cmdLayersOn = this._commands.Create(mkfCmds.LayerAllOn);
        this.cmdLayersOff = this._commands.Create(mkfCmds.LayerAllOff);
        this.cmdLayersPaste = this._commands.Create(mkfCmds.LayersPaste);
        this.cmdLayerAddComp = this._commands.Create(mkfCmds.LayerAddComp);
        this.cmdLayerControl = this._commands.Create(mkfCmds.LayerSetControlBatch);

        this.cmdLigaFromSelection = this._commands.Create(mkfCmds.LigatureFromSelection);

        this.cmdListImportMissing = this._commands.Create(mkfCmds.ImportListMissingGlyphs);
        this.cmdListExportUni = this._commands.Create(mkfCmds.ExportListUni);
        this.cmdListExportUniHex = this._commands.Create(mkfCmds.ExportListUniHex);
        this.cmdListExportArtboardTemplate = this._commands.Create(mkfCmds.ExportListArtboardTemplate);

        this.cmdImportTTF = this._commands.Create(mkfCmds.ImportTTF);
        this.cmdImportFileSingle = this._commands.Create(mkfCmds.ImportFileSingle);
        this.cmdImportFileList = this._commands.Create(mkfCmds.ImportFileList);
        this.cmdImportLigatures = this._commands.Create(mkfCmds.ImportLigatures);
        this.cmdImportMKFont = this._commands.Create(mkfCmds.ImportMKFont);

        this.shortcuts.Create("Ctrl Z", this._actionStack.Undo);
        this.shortcuts.Create("Ctrl Y", this._actionStack.Redo);
        this.shortcuts.Create("Ctrl A", {
            fn: () => {
                this._viewport._selStack.data.RequestSelectAll();
                nkm.ui.dom.ClearHighlightedText();
            }
        }).Strict();

        this.shortcuts.Create("escape", () => { 
            this._registerEmptySelection = true;
            this._inspectedData.Clear(); 
            this._registerEmptySelection = false;
        });

        for (let i = 0; i < 10; i++) {
            this.shortcuts.Create(`Ctrl ${i}`, () => { this._StoreSelectionPreset(i); });
            this.shortcuts.Create(`Shift ${i}`, () => { this._RestoreSelectionPreset(i, true); });
            this.shortcuts.Create(`${i}`, () => { this._RestoreSelectionPreset(i, false); });
        }

    }

    _StoreSelectionPreset(p_index) {
        if (!this._data) { return; }
        let preset = [];
        for (let i = 0; i < this._inspectedData.stack.count; i++) { preset.push(this._inspectedData.stack.At(i).u); }
        this._data._selectionPresets[p_index] = preset;
    }

    _RestoreSelectionPreset(p_index, p_append = false) {
        if (!this._data) { return; }
        let preset = this._data._selectionPresets[p_index];
        if (!preset || preset.length == 0) { return; }
        let restored;
        if (p_append) { restored = [...this._inspectedData.stack._array]; }
        else { restored = []; }
        for (let i = 0; i < preset.length; i++) { restored.push(UNICODE.GetInfos(preset[i])); }
        if (restored.length == 0) { return; }
        this._inspectedData.SetList(restored);
    }

    _OnDisplayGain() {
        super._OnDisplayGain();
    }

    _PostInit() {
        super._PostInit();
        this._actionStackInspector.data = this._actionStack;
    }

    _InitShelfCatalog(p_configList) {

        let shellClass = this.constructor.__default_inspectorShellClass;
        shellClass.__placeholderViewClass = mkfInspectors.GlyphInspectorPlaceholder;

        p_configList.push(
            {
                [ui.IDS.NAME]: `Inspector`,
                [ui.IDS.ICON]: `text`,
                [ui.IDS.VIEW_CLASS]: shellClass,
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
            /*
            {
                [ui.IDS.NAME]: `Actions`,
                [ui.IDS.ICON]: `action`,
                [ui.IDS.VIEW_CLASS]: mkfInspectors.FamilyActions,
                assign: `_actionsInspector`,
            },
            */
            {
                [ui.IDS.NAME]: `History`,
                [ui.IDS.ICON]: `refresh`,
                [ui.IDS.VIEW_CLASS]: nkm.uiworkspace.inspectors.ActionStack,
                assign: `_actionStackInspector`,
                [ui.IDS.DATA]: this._actionStack,
                forwardData: false
            }
        );

    }

    _RegisterEditorBits() {

        super._RegisterEditorBits();

        this._leftShelf
            .Watch(nkm.uilib.SIGNAL.CURRENT_HANDLE_CHANGED, this._OnLeftShelfHandleChanged, this);

        this._leftShelf.catalog = this._leftShelfCatalog;

        let confs = this._leftShelfList;

        for (let i = 0, n = confs.length; i < n; i++) {

            let
                conf = confs[i],
                item = this._leftShelfCatalog.Register(conf),
                view = item.GetOption('view', null),
                assign = u.tils.Get(conf, `assign`, null);

            if (view) {

                if (`forwardData` in conf && !conf.forwardData) { }
                else { this.forwardData.To(view); }

                this._forwardContext.To(view);

                if (assign) { this[assign] = view; }

            }

        }

    }

    _PostInit() {
        super._PostInit();
        this._contentInspector.RequestDisplay();
        //this._pangramInspector.RequestDisplay();

        this._inspectorShell.header.style.display = `none`;
        this._shelf._nav.visible = false;

        this.inspectedData.Clear();

    }

    static _Style() {
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
        }, base._Style());
    }

    _Render() {

        super._Render();

        this._leftShelf = this.Attach(this.constructor.__default_shelfClass, `shelf`, this._body);
        this._leftShelf.orientation = ui.FLAGS.VERTICAL;
        this._leftShelf.navPlacement = ui.FLAGS.LEFT;

        this._shelf.orientation = ui.FLAGS.HORIZONTAL;
        this._shelf.navPlacement = ui.FLAGS.TOP;

        this._pangramViewport = this.Attach(mkfViewports.Pangram, `horizontal viewport`, this._body);
        this._pangramViewport.visible = false;

        ui.dom.AttachFirst(this._pangramViewport, this._body, false);
        ui.dom.AttachFirst(this._leftShelf, this._body, false);

        this._stateStack.HookButtons(this._header._navPrevBtn, this._header._navNextBtn);
        this._header._navPrevBtn.trigger = this._stateStack.Previous;
        this._header._navNextBtn.trigger = this._stateStack.Next;
    }

    SetActiveRange(p_rangeData) {

        this._displayRange = p_rangeData ? p_rangeData.options : null;
        this._viewport.displayRange = this._displayRange;

        this._stateStack.Push({
            oldRange: this._cachedRangeData,
            newRange: p_rangeData,
            restore: (p_self, p_forward) => {
                let data = p_forward ? p_self.newRange : p_self.oldRange;
                if (data) { this.SetActiveRange(data); }
            }
        }, true);

        this._cachedRangeData = p_rangeData;

    }

    _OnLeftShelfHandleChanged(p_shelf, p_newHandle, p_oldHandle) {

        return;

        if (!p_newHandle) { return; }
        let assign = p_newHandle.GetOption(`assign`, null);

        switch (assign) {
            case `_contentInspector`:
                this._viewport.visible = true;
                this._pangramViewport.visible = false;
                break;
            case `_pangramInspector`:
                this._viewport.visible = false;
                this._pangramViewport.visible = true;
                break;
        }

    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        let ar = UNICODE.instance._blockCatalog.At(0);
        if (this._data) {
            
            this._OnDataValueChanged(this._data, mkfData.IDS.PREVIEW_SIZE, null);
            
            if (this._data._glyphs.count > 0) {
                ar = this._contentInspector._specialCatalog.At(0); //My Glyphs
            }

            this.SetActiveRange(ar);
            this._viewport._RefreshItems();
            
        }
    }

    _OnDataValueChanged(p_data, p_id, p_valueObj) {

        let infos = mkfData.IDS.GetInfos(p_id);

        if (!infos) { return; }

        if (infos.recompute) {

            p_data._UpdateDisplayValues();

            let s = p_data.Get(mkfData.IDS.PREVIEW_SIZE),
                rW = p_data._contextInfos.raw,
                rH = p_data._contextInfos.rah,
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

            this.style.setProperty(`--glyph-color`, p_data.Get(mkfData.IDS.COLOR_PREVIEW));
            this.style.setProperty(`--preview-size`, `${s}px`);
            this.style.setProperty(`--preview-height`, `${fH * 0.8}px`);
            this.style.setProperty(`--preview-width`, `${fW * 0.8}px`);
            this.style.setProperty(`--preview-ratio`, `${rW}/${rH}`);

            this._viewport.SetPreviewSize(fW, fH);

        }
    }

    _OnGlyphAdded(p_family, p_glyph) { this._inspectedData.DelayedUpdate(true); }

    _OnGlyphRemoved(p_family, p_glyph) { this._inspectedData.DelayedUpdate(true); }

    _AnalyizeGlyphInfos(p_infos, p_analytics, index, total) {

        let glyph = this._data.GetGlyph(p_infos.u);

        if (glyph.isNull) {
            p_analytics.nullGlyphs++;
        } else {
            p_analytics.existingGlyphs++;
            p_analytics.existing.push(glyph.activeVariant);
            p_analytics.existingInfos.push(p_infos);
        }

        p_analytics.uuni += `${UNICODE.UUni(p_infos)}${index < total - 1 ? ', ' : ''}`;

    }

    //

    RequestClose() {
        // TODO : Check if unsaved changes
        if (this._data.isDirty) {
            nkm.dialog.Push({
                title: `Close editor`,
                message: `Unsaved changes will be lost, are you sure?`,
                actions: [
                    { label: `Don't save and Close`, icon: `warning`, flavor: nkm.com.FLAGS.WARNING, trigger: { fn: this._ConfirmClose } }, //variant: nkm.ui.FLAGS.FRAME
                    { label: `Cancel` }
                ],
                icon: `warning`,
                flavor: nkm.com.FLAGS.WARNING,
                origin: this,
            });
        } else {
            super.RequestClose();
        }
    }

    _ConfirmClose() {
        super.RequestClose();
    }

    _CleanUp() {
        this._bindingManager.Clear();
        this._viewport._selStack.Clear();
        super._CleanUp();
    }

}

module.exports = FontEditor;
ui.Register(`mkf-font-editor`, FontEditor);