'use strict';

const { uilib } = require("@nkmjs/core");
const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const u = nkm.u;
const ui = nkm.ui;

const mkfWidgets = require(`../../widgets`);

const base = ui.WidgetItem;
class GlyphGroup extends base {
    constructor() { super(); }

    _Init() {

        super._Init();

        this._extensions.Remove(this._extDrag);

        this._builder = new ui.helpers.CatalogBuilder();
        this._builder
            .Watch(com.SIGNAL.ITEM_ADDED, this._OnCatalogItemAdded, this)
            .Watch(com.SIGNAL.ITEM_REMOVED, this._OnCatalogItemRemoved, this);

        this._builder.owner = this;
        this._builder._defaultItemClass = mkfWidgets.GlyphSlot;
        this._builder._defaultGroupClass = GlyphGroup;

        /*
                this._extExpand = this._extensions.Add(ui.extensions.Expand);
                this._extExpand
                .Watch(ui.SIGNAL.COLLAPSED, this._builder.Disable, this._builder)
                .Watch(ui.SIGNAL.EXPANDED, this._builder.Enable, this._builder);
        */

    }

    _PostInit() {
        super._PostInit();
        this._builder.host = this._tpl.body;
    }


    static _Style() {
        return nkm.style.Extends({
            ':host': {
                ...nkm.style.flex.column,
            },
            '.header': {
                ...nkm.style.flex.row,
                ...nkm.style.flex.align.center.all,
            },
            '.body': {
                ...nkm.style.flex.rows,
            },
            '.group': {
                ...nkm.style.flexItem.grow,
            },
            '.item': {
                ...nkm.style.flexItem.fixed,
                'margin':'3px'
            }
        }, base._Style());
    }

    _Render() {
        super._Render();
        this._tpl = ui.DOMTemplate.Render(uilib.dom.BodyExpand, this);
    }

    //#region Catalog Management

    /**
     * @description TODO
     * @type {data.core.Catalog}
     */
    get catalog() { return this._builder.catalog; }
    set catalog(p_value) { 
        this._builder.catalog = p_value; 
        if(p_value){
            this._tpl[ui.IDS.LABEL].Set(p_value.name);
        }
    }

    /**
     * @description Create a view & a nav item from a catalogItem
     * @param {CatalogViewBuilder} p_builder 
     * @param {data.core.catalogs.CatalogItem} p_item 
     */
    _OnCatalogItemAdded(p_builder, p_item, p_mappedWidget) {

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

    //#endregion

    _CleanUp() {
        this.catalog = null;
        super._CleanUp();
    }

}

module.exports = GlyphGroup;
ui.Register(`mkf-glyph-group`, GlyphGroup);