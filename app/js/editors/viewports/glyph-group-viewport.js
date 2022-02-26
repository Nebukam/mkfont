const { uilib } = require("@nkmjs/core");
const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const u = nkm.utils;
const ui = nkm.ui;

const mkfWidgets = require(`../../widgets`);
const GlyphGroup = require(`./glyph-group`);

class GlyphGroupsView extends ui.views.View {
    constructor() { super(); }

    _Init() {
        super._Init();

        this._builder = new ui.helpers.CatalogBuilder();
        this._builder
            .Watch(com.SIGNAL.ITEM_ADDED, this._OnCatalogItemAdded, this)
            .Watch(com.SIGNAL.ITEM_REMOVED, this._OnCatalogItemRemoved, this);

        this._builder.owner = this;
        this._builder._defaultItemClass = mkfWidgets.GlyphSlot;
        this._builder._defaultGroupClass = GlyphGroup;

        this._extExpand = this._extensions.Add(ui.extensions.Expand);
        this._extExpand
            .Watch(ui.SIGNAL.COLLAPSED, this._builder.Disable, this._builder)
            .Watch(ui.SIGNAL.EXPANDED, this._builder.Enable, this._builder);

    }

    _PostInit() {
        super._PostInit();
        this._builder.host = this._groupWrapper;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                'display': 'flex',
                'flex-flow': 'row nowrap'
            },
            '.group-wrapper': {
                'position': 'relative',
                'display': 'flex',
                'flex-flow': 'row wrap',
                'flex': '1 1 auto',
                'overflow': 'auto',
                'align-items': 'flex-start',
                'align-content': 'flex-start'
            },
            '.group': {
                'flex': '1 0 auto',
                'min-height': 0,
            },
            '.item': {
                'flex': '1 0 auto',
                'margin':'3px',
            }
        }, super._Style());
    }

    _Render() {
        super._Render();

        this._controls = ui.dom.El("div", { class: 'controls' }, this._host);
        this._groupWrapper = ui.dom.El("div", { class: 'group-wrapper' }, this._host);
    }

    //#region Catalog Management

    /**
     * @description TODO
     * @type {data.core.Catalog}
     */
    get catalog() { return this._builder.catalog; }
    set catalog(p_value) { this._builder.catalog = p_value; }

    /**
     * @description Create a view & a nav item from a catalogItem
     * @param {CatalogViewBuilder} p_builder 
     * @param {data.core.catalogs.CatalogItem} p_item 
     */
    _OnCatalogItemAdded(p_builder, p_item, p_mappedWidget) {
        p_mappedWidget.catalog = p_item;
    }

    /**
     * @access protected
     * @description Remove the view & handle associated with the removed catalogItem
     * @param {ui.core.helpers.CatalogViewBuilder} p_builder 
     * @param {data.core.catalogs.CatalogItem} p_item 
     * @param {ui.core.View} p_mappedWidget 
     */
    _OnCatalogItemRemoved(p_builder, p_item, p_mappedWidget, p_index) {

    }

    _OnDataUpdated(p_data){
        super._OnDataUpdated(p_data);
        this._RefreshItems();
    }


    _RefreshItems(){
        for(let i = 0; i < this._displayList.count; i++){
            let item = this._displayList.At(i);
            item._UpdateGlyphPreview();
        }
    }

    //#endregion

    //#region Preview tweaks



    //#endregion

}

module.exports = GlyphGroupsView;
ui.Register(`mkfont-glyph-group-viewport`, GlyphGroupsView);