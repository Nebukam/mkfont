const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const svgpath = require('svgpath');

const UNICODE = require(`../unicode`);
const mkfData = require(`../data`);
const mkfInspectors = require(`./inspectors`);
const mkfWidgets = require(`../widgets`);

class EditorListImport extends nkm.datacontrols.Editor {
    constructor() { super(); }

    static __assignMap = {
        [mkfData.ENUMS.ASSIGN_FILENAME]: mkfWidgets.importation.AssignFilename,
        [mkfData.ENUMS.ASSIGN_FROM_BLOCK]: mkfWidgets.importation.AssignBlock,
        [mkfData.ENUMS.ASSIGN_FROM_BLOCK_RANGE]: mkfWidgets.importation.AssignBlockRange,
        [mkfData.ENUMS.ASSIGN_SELECTION]: mkfWidgets.importation.AssignSelection,
        [mkfData.ENUMS.ASSIGN_SELECTION_RANGE]: mkfWidgets.importation.AssignSelectionRange,
    };

    _Init() {
        super._Init();
        this._builder = new nkm.datacontrols.helpers.ControlBuilder(this);
        this.forwardData.To(this._builder);

        this._dataObserver.Hook(nkm.com.SIGNAL.VALUE_CHANGED, this._OnDataValueChanged, this);
        this._assignManager = null;

        this._importList = [];

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'grid',
                'flex-flow': 'column wrap',
                'flex': '0 0 auto',
                'grid-template-columns': 'max-content max-content max-content',
                'grid-template-rows': '180px 1fr',
                'grid-gap': '10px'
            },
            '.item': {
                'flex': '1 0 auto',
                'grid-column-start': '1',
            },
            '.list': {
                'position': 'relative',
                'height': '0',
                'width': '300px',
                //'padding': '10px',
                'background-color': 'rgba(0,0,0,0.2)',
                'grid-column-start': '2',
                'grid-row': '1 / span 2',
                'overflow': 'auto',
                'min-height': '100%',
            },
            '.settings': {
                'width': '300px'
            },
            '.preview': {
                'position': 'relative',
                'width': '400px',
                'height': '100%',
                //'aspect-ratio': '1/1',
                'flex': '0 0 100%',
                'background-color': '#1b1b1b',
                'border-radius': '3px',
                'grid-column-start': '3',
                'grid-row': '1 / span 2',
            },
            '.identity': {
                'width': '100%'
            },
            '.header': {
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'flex': '1 1 auto',
                'min-height': '0',
                'max-width': '300px',
                'align-content': 'flex-start',
            },
            '.control': {
                'flex': '0 1 auto',
                'margin': '0 2px 5px 2px'
            },
            '.small': {
                // 'flex': '1 1 45%'
            }
        }, super._Style());
    }

    _Render() {

        super._Render();

        this._header = ui.El(`div`, { class: `item header` }, this._host);

        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;
        this._builder.host = this._header;
        this._builder.Build([
            { options: { propertyId: mkfData.IDS_EXT.IMPORT_OVERLAP_MODE } },
            { cl: mkfWidgets.ControlHeader, options: { label: `Import method` } },
            { options: { propertyId: mkfData.IDS_EXT.IMPORT_ASSIGN_MODE } },
        ]);

        this._settingsInspector = this.Attach(mkfInspectors.TransformSettings, `item settings`);
        this.forwardData.To(this._settingsInspector);

        this._domStreamer = this.Attach(ui.helpers.DOMStreamer, `list`);
        this._domStreamer
            .Watch(ui.SIGNAL.ITEM_CLEARED, this._OnItemCleared, this)
            .Watch(ui.SIGNAL.ITEM_REQUESTED, this._OnItemRequested, this);

        this._domStreamer.options = {
            layout: {
                itemSlots: 1,
                itemSize: 60,
                itemCount: 0,
            }
        };

        this._glyphRenderer = this.Attach(mkfWidgets.GlyphCanvasRenderer, `preview`, this._host);
        this._glyphRenderer.options = {
            drawGuides: true,
            drawLabels: true,
            drawBBox: true,
            centered: false,
        };

    }

    set subFamily(p_value) { this._subFamily = p_value; }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        if (this._data) {
            this._RefreshAssignManager();
            this._domStreamer.itemCount = this._importList.length;
        } else {
            this._domStreamer.itemCount = 0;
        }
    }

    _OnDataValueChanged(p_data, p_id, p_valueObj, p_oldValue) {
        if (p_id == mkfData.IDS_EXT.IMPORT_ASSIGN_MODE) { this._RefreshAssignManager(); }
    }

    _RefreshAssignManager() {

        if (this._assignManager) {
            this._builder.Remove(this._assignManager);
            this._assignManager = null;
        }

        console.log(this._data.Get(mkfData.IDS_EXT.IMPORT_ASSIGN_MODE));

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

        if (!p_data) { return; }

        let
            contextInfos = this._subFamily._contextInfos,
            pathData = p_data.svgStats,
            transformedPath = SVGOPS.FitPath(
                this._data,
                contextInfos,
                pathData
            );

        this._glyphRenderer.contextInfos = contextInfos;
        this._glyphRenderer.glyphWidth = transformedPath.width;
        this._glyphRenderer.glyphPath = transformedPath.path;
        this._glyphRenderer.computedPath = transformedPath;
        this._glyphRenderer.Draw();

    }

    GetGlyphVariant(p_unicodeInfos) {
        return this._subFamily.family.GetGlyph(p_unicodeInfos.u).GetVariant(this._subFamily);
    }

    _CleanUp() {
        this.catalog = null;
        super._CleanUp();
    }

}

module.exports = EditorListImport;
ui.Register(`mkfont-list-import-editor`, EditorListImport);