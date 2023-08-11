'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const svgpath = require('svgpath');

const UNICODE = require(`../unicode`);
const mkfData = require(`../data`);
const mkfInspectors = require(`./inspectors`);
const mkfWidgets = require(`../widgets`);
const LOC = require('../locales');

const base = nkm.datacontrols.Editor;
class EditorListImport extends base {
    constructor() { super(); }

    static __assignMap = {
        [mkfData.ENUMS.ASSIGN_FILENAME]: mkfWidgets.importation.AssignFilename,
        [mkfData.ENUMS.ASSIGN_FROM_BLOCK]: mkfWidgets.importation.AssignBlock,
        [mkfData.ENUMS.ASSIGN_FROM_BLOCK_RANGE]: mkfWidgets.importation.AssignBlockRange,
        [mkfData.ENUMS.ASSIGN_SELECTION]: mkfWidgets.importation.AssignSelection,
        [mkfData.ENUMS.ASSIGN_SEL_RANGE]: mkfWidgets.importation.AssignSelectionRange,
    };

    _Init() {
        super._Init();

        this._dataObserver.Hook(nkm.com.SIGNAL.VALUE_CHANGED, this._OnDataValueChanged, this);
        this._assignManager = null;

        this._importList = [];
        this._importSelection = null;

    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                ...nkm.style.flex.row,
                ...nkm.style.flexItem.fill,
                'grid-gap': '10px'
            },
            '.item': {
                ...nkm.style.flexItem.grow,
            },
            '.column': {
                'overflow-x': 'hidden',
                'overflow-y': 'auto',
                ...nkm.style.flexItem.fill,
            },
            '.frst': { 'width': `300px`, },
            '.list': {
                'width': '270px',
                'background-color': 'rgba(0,0,0,0.2)',
                'overflow': 'auto',
                'min-height': '0',
            },
            '.preview': {
                'aspect-ratio': '1/1',
                'width': '330px',
                'border-radius': '3px',
            },
            '.renderer': {
                ...nkm.style.rules.pos.abs,
                'width': '100%',
                'height': '100%',
            },
            '.isover': { 'background-color': 'rgba(27,27,27,0.8)', },
            '.identity': {
                'width': '100%',
                'max-width': `330px`
            },
            '.header': {
                ...nkm.style.flex.column,
                ...nkm.style.flexItem.fill,
                'width': `calc(100% - 22px)`,
                'align-content': 'flex-start',
                'border-radius': '4px',
                'padding': `10px`,
                'border': `1px solid rgba(127, 127, 127, 0.25)`,
                'margin-bottom': `10px`
            },
            '.tagbar': {
                ...nkm.style.rules.absolute.bottom,
                'margin-bottom': `10px`
            }
        }, base._Style());
    }

    _Render() {

        super._Render();

        // First col

        let column = ui.El(`div`, { class: `column frst` }, this._host);
        this._header = ui.El(`div`, { class: `item header` }, column);

        let builder = new nkm.datacontrols.helpers.ControlBuilder(this);
        builder.options = { host: this._header, cl: nkm.datacontrols.widgets.ValueControl, css: `control` };
        this.forwardData.To(builder);

        builder.Build([
            { options: { propertyId: mkfData.IDS_EXT.IMPORT_OVERLAP_MODE } },
            { options: { propertyId: mkfData.IDS_EXT.IMPORT_ASSIGN_MODE } },
        ]);

        this._builder = builder;

        builder = new nkm.datacontrols.helpers.ControlBuilder(this);
        builder.options = { host: column, cl: nkm.datacontrols.widgets.ValueControl, css: `control` };
        this.forwardData.To(builder);

        builder.Build([
            { options: { propertyId: mkfData.IDS_EXT.IMPORT_BIND_RESOURCE, invertInputOrder: true } },
            { options: { propertyId: mkfData.IDS_EXT.IMPORT_TEXT_AS_LAYERS, invertInputOrder: true } },
            { cl: nkm.datacontrols.widgets.MiniHeader, options: { label: LOC.labelTr } },
        ]);

        this._settingsInspector = this.Attach(mkfInspectors.TransformSettings, `item settings`, column);
        this.forwardData.To(this._settingsInspector);

        // Second col

        this._domStreamer = this.Attach(ui.helpers.DOMStreamer, `column list`);
        this._domStreamer
            .Watch(ui.SIGNAL.ITEM_CLEARED, this._OnItemCleared, this)
            .Watch(ui.SIGNAL.ITEM_REQUESTED, this._OnItemRequested, this);

        this._domStreamer.options = {
            layout: {
                itemSlots: 1,
                itemSize: 66,
                itemCount: 0,
            }
        };

        // Third col

        column = ui.El(`div`, { class: `column third` }, this._host);

        this._identity = this.Attach(mkfWidgets.GlyphIdentity, `identity`, column);

        let previewCtnr = ui.El(`div`, { class: `preview` }, column);

        this._underlayGlyphRenderer = this.Attach(mkfWidgets.GlyphCanvasRenderer, `renderer`, previewCtnr);
        this._underlayGlyphRenderer.options = {
            drawGuides: true,
            drawLabels: false,
            drawBBox: true,
            centered: false,
        };


        this._glyphRenderer = this.Attach(mkfWidgets.GlyphCanvasRenderer, `renderer isover`, previewCtnr);
        this._glyphRenderer.options = {
            drawGuides: true,
            drawLabels: true,
            drawBBox: true,
            centered: false,
        };

        this._tagBar = this.Attach(ui.WidgetBar, `tagbar`, previewCtnr);
        this._tagBar.options = {
            defaultWidgetClass: nkm.uilib.widgets.Tag,
            /* size: ui.FLAGS.SIZE_XS */
        };

        this._preserved = this._tagBar.CreateHandle();
        this._preserved.bgColor = `rgba(var(--col-cta-rgb),0.5)`;
        this._preserved.label = `uses existing transforms`;

    }

    get family() { return this._family; }
    set family(p_value) { this._family = p_value; }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        if (this._data) {
            this._RefreshAssignManager();
            this._domStreamer.itemCount = this._importList.length;
            this.inspectedData.Set(this._importList[0]);
        } else {
            this._domStreamer.itemCount = 0;
        }
    }

    _OnDataValueChanged(p_data, p_id, p_newValue, p_oldValue) {

        if (p_id == mkfData.IDS_EXT.IMPORT_ASSIGN_MODE) { this._RefreshAssignManager(); }
        let descriptor = nkm.data.GetDescriptor(p_id);

        if (!descriptor) { return; }

        this._assignManager._UpdateList();

    }

    _RefreshAssignManager() {

        if (this._assignManager) {
            this._builder.Remove(this._assignManager);
            this._assignManager = null;
        }

        let cl = this.constructor.__assignMap[this._data.Get(mkfData.IDS_EXT.IMPORT_ASSIGN_MODE)];
        if (!cl) { return; }

        this._assignManager = this._builder.Add(cl, null, { importList: this._importList }, true);
        this._assignManager.Watch(nkm.com.SIGNAL.UPDATED, this._OnImportListUpdated, this);
        this._assignManager.importList = this._importList;

    }

    _OnImportListUpdated(p_manager) {
        // Refresh dom items, I guess
        this._domStreamer._items.forEach((item) => { item.Update(); });
    }

    _OnInspectableItemBumped(p_selection, p_data) {
        super._OnInspectableItemBumped(p_selection, p_data);
        this._UpdatePreview(p_data);
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._UpdatePreview(this._inspectedData.lastItem);
    }

    _OnItemCleared() {

    }

    _OnItemRequested(p_streamer, p_index, p_fragment, p_returnFn) {

        let
            data = this._importList[p_index],
            newItem = this.Attach(mkfWidgets.importation.ImportListItem, `item`, p_fragment);

        newItem.editor = this;
        //TODO : Assigne existing transform data, if any. 
        newItem.data = data;

        p_returnFn(p_index, newItem)

    }

    _UpdatePreview(p_data) {

        if (!p_data) {
            this._identity.data = null;
            return;
        }

        this._identity.data = p_data.unicodeInfos;

        let
            refTransform = p_data.preserved ? p_data.variant._transformSettings : this._data,
            contextInfos = this._family._contextInfos,
            pathData = p_data.svgStats,
            transformedPath = SVGOPS.FitPath(
                refTransform,
                contextInfos,
                pathData
            );

        this._preserved.visible = p_data.preserved;

        this._glyphRenderer.contextInfos = contextInfos;
        this._glyphRenderer.glyphWidth = transformedPath.width;
        this._glyphRenderer.glyphPath = transformedPath.path;
        this._glyphRenderer.computedPath = transformedPath;
        this._glyphRenderer.Draw();

        if (p_data.variant) {

            pathData = p_data.variant.Get(mkfData.IDS.PATH_DATA);

            this._underlayGlyphRenderer.visible = true;
            this._underlayGlyphRenderer.contextInfos = contextInfos;
            this._underlayGlyphRenderer.glyphWidth = pathData.width;
            this._underlayGlyphRenderer.glyphPath = pathData.path;
            this._underlayGlyphRenderer.computedPath = pathData;
            this._underlayGlyphRenderer.Draw();

        } else {
            this._underlayGlyphRenderer.visible = false;
        }

    }

    GetGlyphVariant(p_unicodeInfos) {
        return this._family.GetGlyph(p_unicodeInfos?.u).activeVariant;
    }

    _CleanUp() {
        this._importList.length = 0;
        this._importSelection = null;
        super._CleanUp();
    }

}

module.exports = EditorListImport;
ui.Register(`mkf-list-import-editor`, EditorListImport);