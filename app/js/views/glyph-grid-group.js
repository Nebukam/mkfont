const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const u = nkm.utils;
const ui = nkm.ui;

class GlyphGridGroup extends ui.views.View {
    constructor() { super(); }

    _Init() {
        super._Init();

        this._catalogBuilder = new ui.helpers.CatalogBuilder();
        this._catalogBuilder
            .Watch(com.SIGNAL.ITEM_ADDED, this._OnCatalogItemAdded, this)
            .Watch(com.SIGNAL.ITEM_REMOVED, this._OnCatalogItemRemoved, this);

        this._extExpand = this._extensions.Add(ui.extensions.Expand);
        this._extExpand
        .Watch(ui.SIGNAL.COLLAPSED, this._catalogBuilder.Disable, this._catalogBuilder)
        .Watch(ui.SIGNAL.EXPANDED, this._catalogBuilder.Enable, this._catalogBuilder);

    }


    _Style() {
        return nkm.style.Extends({
            ':host': {

            },
        }, super._Style());
    }

    _Render(){
        super._Render();

    }

    //#region Catalog Management

    /**
     * @description TODO
     * @type {data.core.Catalog}
     */
    get catalog() { return this._catalogBuilder.catalog; }
    set catalog(p_value) { this._catalogBuilder.catalog = p_value; }
 
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

}

module.exports = GlyphGridGroup;
ui.Register(`mkfont-glyph-grid-group`, GlyphGridGroup);