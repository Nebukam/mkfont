'use strict';

const { uilib, datacontrols } = require("@nkmjs/core");
const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const u = nkm.u;
const ui = nkm.ui;

const UNICODE = require(`../../unicode`);
const SIGNAL = require(`../../signal`);
const IDS_EXT = require(`../../data/ids-ext`);
const UTILS = require(`../../data/utils`);
const RangeContent = require(`../../data/range-content`);
const ContentUpdater = require("../../content-updater");
const mkfWidgets = require(`../../widgets`);
const GlyphGroup = require(`./glyph-group`);
const GlyphGroupHeader = require(`./glyph-group-header`);
const GlyphGroupFooter = require(`./glyph-group-footer`);
const GlyphGroupSearch = require(`./glyph-group-search`);

const base = nkm.datacontrols.ControlView; //ui.views.View
class GlyphGroupViewport extends base {
    constructor() { super(); }

    _Init() {
        super._Init();

        this._domStreamer = null;
        this._unicodeMap = new Map();
        this._displayRange = null;

        this._inspectionDataForward = new datacontrols.helpers.InspectionDataBridge(this);
        this.forwardEditor.To(this._inspectionDataForward);

        this._dataObserver
            .Hook(SIGNAL.GLYPH_ADDED, this._OnGlyphAdded, this)
            .Hook(SIGNAL.GLYPH_REMOVED, this._OnGlyphRemoved, this);

        this._searchSettings = null;

        this._searchObserver = new nkm.com.signals.Observer();
        this._searchObserver
            .Hook(SIGNAL.SEARCH_TOGGLED, this._OnSearchToggled, this)
            .Hook(SIGNAL.SEARCH_STARTED, this._OnSearchStarted, this)
            .Hook(SIGNAL.SEARCH_COMPLETE, this._OnSearchComplete, this);

        this._searchActive = false;

        let dataSel = nkm.ui.helpers.HostSelStack(this, true, true, {
            add: {
                fn: (p_sel, p_index) => {
                    let widget = this._domStreamer.GetItemAt(p_index);
                    if (widget) { widget.Select(true); }
                    else { p_sel.Add(this._content[p_index]); }
                }, thisArg: this
            },
            remove: {
                fn: (p_sel, p_index, p_data) => {
                    let widget = this._domStreamer.GetItemAt(p_index);
                    if (widget) { widget.Select(false); }
                    else { p_sel.Remove(this._content[p_index]); }
                }, thisArg: this
            },
            count: {
                fn: (p_sel) => { return this._content ? this._content.length : 0; }, thisArg: this
            },
            index: {
                fn: (p_sel, p_data) => { return this._content ? this._content.indexOf(p_data) : -1; }, thisArg: this
            },
        }).data;

        //dataSel.autoBump = true;

        this._inspectionDataForward.dataSelection = dataSel;
        dataSel
            .Watch(com.SIGNAL.ITEM_ADDED, this._OnSelectionStackBump, this)
            .Watch(com.SIGNAL.ITEM_BUMPED, this._OnSelectionStackBump, this);

        this._contentRange = new RangeContent();
        this._contentRange.Watch(nkm.com.SIGNAL.READY, this._OnRangeReady, this);
        this.forwardData
            .To(this._contentRange, { mapping: `family` })
            .To(this, { dataMember: `searchSettings`, mapping: `searchSettings` });

        this._content = null;

    }

    _PostInit() {
        super._PostInit();
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                '--streamer-gap': '10px',
                'overflow': 'clip'
            },
            '.header, .search, .footer': {
                'flex': '0 0 auto',
            },
            '.dom-stream': {
                'position': 'relative',
                'flex': '1 1 auto',
                'overflow': 'auto',
            },
            '.dom-stream.empty': {
                'display': 'block !important'
            },
            '.search-status': {
                '@': ['absolute-center']
            }
        }, base._Style());
    }

    _Render() {
        super._Render();

        this._header = this.Attach(GlyphGroupHeader, `header`);

        this._searchStatus = this.Attach(mkfWidgets.SearchStatus, `search-status`);
        this._search = this.Attach(GlyphGroupSearch, `search`);
        this._search.status = this._searchStatus;

        this._domStreamer = this.Attach(ui.helpers.DOMStreamer, 'dom-stream');
        this._domStreamer
            .Watch(ui.SIGNAL.ITEM_CLEARED, this._OnItemCleared, this)
            .Watch(ui.SIGNAL.ITEM_REQUESTED, this._OnItemRequested, this);

        this._domStreamer.options = {
            layout: {
                itemWidth: 200,
                itemHeight: 200,
                itemCount: 0,
                gap: 5,
                //customArea:{ start:0, size:200 }
            }
        };

        this._footer = this.Attach(GlyphGroupFooter, `footer`);

        this.forwardData
            .To(this._header)
            .To(this._footer);

        this.forwardContext
            .To(this._header)
            .To(this._footer);

    }

    SetPreviewSize(p_width, p_height) {

        this._domStreamer.options = {
            layout: {
                itemWidth: p_width,
                itemHeight: p_height + 50,
                gap: 5
            }
        };

    }

    set searchSettings(p_value) {
        if (this._searchSettings == p_value) { return; }

        this._searchSettings = p_value;
        this._searchObserver.ObserveOnly(p_value);
        this._search.data = p_value;
        //this._OnSearchToggled();
    }

    set displayRange(p_value) {

        if (this._displayRange == p_value) { return; }

        this._displayRange = p_value;
        this.selectionStack.Clear();

        this._domStreamer.SetFocusIndex(-1);

        this._contentRange.displayRange = p_value;
        this._header.displayRange = p_value;

    }

    _OnRangeReady(p_range) {

        //Active range content is ready
        if (this._searchActive) { this._SetContentSource(null); }
        else { this._SetContentSource(this._contentRange._content); }

        this._searchSettings._UpdateSearchData(p_range);

    }

    //#region search

    _OnSearchToggled() {

        let oldValue = this._searchActive;
        this._searchActive = this._searchSettings ? this._searchSettings.Get(IDS_EXT.SEARCH_ENABLED) : false;

        if (oldValue == this._searchActive) { return; }

        if (!this._searchActive) {
            this._SetContentSource(this._contentRange._content);
        } else {
            if (this._searchSettings.ready) { this._OnSearchComplete(); }
            else { this._OnSearchStarted(); }
        }

    }

    _OnSearchStarted() {
        if (this._searchActive) { this._SetContentSource(null); }
    }

    _OnSearchComplete() {
        if (this._searchActive) { this._SetContentSource(this._searchSettings._results); }
    }

    //#endregion

    //#region DOM Streamer handling

    _SetContentSource(p_array) {
        this._content = p_array;
        this._domStreamer.itemCount = p_array ? p_array.length : 0;

        if (p_array != null) {
            let index = p_array.indexOf(this.editor.inspectedData.lastItem);
            if (index != -1) { this._domStreamer.SetFocusIndex(index); }

        }
    }

    _OnItemRequested(p_streamer, p_index, p_fragment, p_returnFn) {

        let unicodeInfos = this._content ? this._content[p_index] : null;

        if (!unicodeInfos || !this._data) { return; }

        let widget = this.Attach(mkfWidgets.GlyphSlot, 'glyph', p_fragment);
        widget.context = this._data;
        widget.data = unicodeInfos;

        this._unicodeMap.set(unicodeInfos, widget);

        p_returnFn(p_index, widget);

        this.selectionStack.Check(widget);

        if (this.selectionStack.data.isEmpty) {
            if (!this.editor.inspectedData.isEmpty) {
                if (this.editor.inspectedData.Contains(unicodeInfos)) {
                    widget.Select(true);
                }
            }
        }

    }

    _OnItemCleared(p_item) {
        this._unicodeMap.delete(p_item.data);
    }

    _OnSelectionStackBump(p_data) {
        this._domStreamer.SetFocusIndex(this._content.indexOf(p_data), false);
    }

    //#endregion

    //#region Catalog Management

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        //this._RefreshItems();
    }


    _RefreshItems() {
        this._domStreamer._Stream(null, null, true);
        /*
        for (let i = 0; i < this._displayList.count; i++) {
            let item = this._displayList.At(i);
            if (`_UpdateGlyphPreview` in item) { item._UpdateGlyphPreview(); }
        }
        */
    }

    //#endregion

    //#region Preview updates

    _OnGlyphAdded(p_family, p_glyph) {

        let
            uInfos = p_glyph.unicodeInfos,
            widget = this._unicodeMap.get(uInfos);

        if (widget) { widget._UpdateGlyph(); }

    }

    _OnGlyphRemoved(p_family, p_glyph) {

        let
            uInfos = p_glyph.unicodeInfos,
            widget = this._unicodeMap.get(uInfos);

        if (widget) { widget._UpdateGlyph(); }

    }

    _ReloadList() {
        let range = this._displayRange;
        this._displayRange = null;
        this.displayRange = range;
    }

    //#endregion

}

module.exports = GlyphGroupViewport;
ui.Register(`mkf-glyph-group-viewport`, GlyphGroupViewport);