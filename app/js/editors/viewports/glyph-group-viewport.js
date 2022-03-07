const { uilib } = require("@nkmjs/core");
const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const u = nkm.utils;
const ui = nkm.ui;

const UNICODE = require(`../../unicode`);
const mkfWidgets = require(`../../widgets`);
const GlyphGroup = require(`./glyph-group`);
const GlyphGroupHeader = require(`./glyph-group-header`);

class GlyphGroupsView extends ui.views.View {
    constructor() { super(); }

    _Init() {
        super._Init();
        /*
                nkm.style.STYLE.instance
                    .Watch(`--preview-width`, this._OnPreviewSizeUpdate, this)
                    .Watch(`--preview-height`, this._OnPreviewSizeUpdate, this);
                    */

        this._Bind(this._OnIndexRequestMixed);
        this._Bind(this._OnIndexRequestRange);
        this._Bind(this._OnIndexRequestUnicodes);

        this._OnIndexRequestCB = null;
        this._domStreamer = null;

        this._indexOffset = 0;
        this._indexCount = 0;
        this._referenceList = null;

    }

    _PostInit() {
        super._PostInit();
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                '--streamer-gap': '10px'
            },
            '.header': {
                'flex': '0 0 auto',
            },
            '.dom-stream': {
                'position': 'relative',
                'flex': '1 1 auto',
                'overflow': 'auto',
            }
        }, super._Style());
    }

    _Render() {
        super._Render();

        this._header = this.Add(GlyphGroupHeader, `header`);

        this._domStreamer = this.Add(ui.helpers.DOMStreamer, 'dom-stream', this._host);
        this._domStreamer
            //.Watch(ui.SIGNAL.ITEM_REQUESTED, this._OnItemRequest, this)
            .Watch(ui.SIGNAL.ITEM_REQUEST_RANGE_UPDATE, this._OnItemRequestRangeUpdate, this);

        this._domStreamer.options = {
            layout: {
                itemWidth: 200,
                itemHeight: 200,
                itemCount: 0,
                gap: 10
            }
        };

    }


    SetPreviewSize(p_width, p_height) {
        this._domStreamer.options = {
            layout: {
                itemWidth: p_width,
                itemHeight: p_height + 50,
                //itemCount: this._indexCount,
                gap: 5
            }
        };
    }

    set displayRange(p_value) {
        if (this._displayRanges == p_value) {
            //TODO: If not ligatures, can just return.
            //otherwise, range is dynamic and should be refreshed.
            return;
        }

        this._header.displayRange = p_value;

        if (this._OnIndexRequestCB) {
            this._domStreamer.Unwatch(ui.SIGNAL.ITEM_REQUESTED, this._OnIndexRequestCB, this);
        }

        this._displayRanges = p_value;
        this._referenceList = null;

        if (!p_value) {
            // TODO: Clear streamer
            return;
        }

        if (`includes` in p_value) {
            // Expect an mixed array of indices & [a,b] ranges
            this._indexOffset = p_value.imin;
            this._indexCount = p_value.count;
            this._referenceList = p_value.includes;
            this._OnIndexRequestCB = this._OnIndexRequestMixed;

        } else if (`start` in p_value) {
            // Block with a count & start index
            this._indexOffset = p_value.start;
            this._indexCount = p_value.count;
            this._OnIndexRequestCB = this._OnIndexRequestRange;

        } else if (`unicodes` in p_value) {
            // Single array of unicode string, likely ligatures.
            let list = p_value.unicodes;
            this._indexOffset = 0;
            this._indexCount = list.length;
            this._referenceList = list;
            this._OnIndexRequestCB = this._OnIndexRequestUnicodes;

        }

        // Update request handler based on range type
        if (this._OnIndexRequestCB) {
            this._domStreamer.Watch(ui.SIGNAL.ITEM_REQUESTED, this._OnIndexRequestCB, this);
        }

        //this._domStreamer._ClearItems();
        this._domStreamer.itemCount = this._indexCount;
        this._domStreamer.scroll({ top: 0 });

    }

    //#region Index request handler

    _OnIndexRequestMixed(p_streamer, p_index, p_fragment) {
        let index = this._GetMixedIndex(p_index);
        if (index == -1) { return; }
        let data = UNICODE.instance._charList[index];
        if (data) { this._OnItemRequestProcessed(data, p_streamer, p_index, p_fragment); }
    }

    _GetMixedIndex(p_index) {

        let
            list = this._referenceList,
            advance = this._cachedAdvance;

        for (let i = this._cachedLoopStart, n = list.length; i < n; i++) {
            let range = list[i];

            if (u.isArray(range)) {

                let
                    start = range[0],
                    end = range[1],
                    coverage = end - start + 1,
                    target = start + (p_index - advance); //+1 as range is inclusive

                if (p_index >= advance &&
                    target <= end) {
                    this._cachedLoopStart = i;
                    this._cachedAdvance = advance;
                    return target;
                }

                advance += coverage;

            } else {
                if (p_index == advance) {
                    this._cachedLoopStart = i;
                    this._cachedAdvance = advance;
                    return range;
                }
                advance++;
            }

        }

        return -1;
    }

    _OnIndexRequestRange(p_streamer, p_index, p_fragment) {
        let
            index = p_index + this._indexOffset;
            //hex = index.toString(16).padStart(4, `0`);
        let data = UNICODE.GetSingle(index);

        this._OnItemRequestProcessed(data, p_streamer, p_index, p_fragment);
        //if (data) { this._OnItemRequestProcessed(data, p_streamer, p_index, p_fragment); }
        //else { this._OnItemRequestProcessed(index, p_streamer, p_index, p_fragment); }
    }

    _OnIndexRequestUnicodes(p_streamer, p_index, p_fragment) {
        let unicode = this._referenceList[p_index];
        let data = UNICODE.instance._charMap[unicode];
        if (!data) {
            //Look for data custom entries?
        }
        if (data) { this._OnItemRequestProcessed(data, p_streamer, p_index, p_fragment); }
    }

    //#endregion

    _OnItemRequestProcessed(p_data, p_streamer, p_index, p_fragment) {

        let widget = this.Add(mkfWidgets.GlyphSlot, 'glyph', p_fragment);
        widget.subFamily = this._data.selectedSubFamily;
        widget.glyphInfos = p_data;

        p_streamer.ItemRequestAnswer(p_index, widget);

    }

    _OnItemRequestRangeUpdate() {
        this._cachedLoopStart = 0;
        this._cachedAdvance = 0;
    }
    //#region Catalog Management

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        this._header.data = this._data;
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._RefreshItems();
    }


    _RefreshItems() {
        for (let i = 0; i < this._displayList.count; i++) {
            let item = this._displayList.At(i);
            if (`_UpdateGlyphPreview` in item) { item._UpdateGlyphPreview(); }
        }
    }

    //#endregion

    //#region Preview tweaks



    //#endregion

}

module.exports = GlyphGroupsView;
ui.Register(`mkfont-glyph-group-viewport`, GlyphGroupsView);