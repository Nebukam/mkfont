const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfCatalog = require(`../../catalogs`);

// Manages what is shown & selectable in the viewport.



class FamilyContentInspector extends nkm.datacontrols.InspectorView {
    constructor() { super(); }

    _Init() {
        
        super._Init();

        this._specialCatalog = nkm.data.catalogs.CreateFrom(
            { name: 'Quick access', localItemClass: mkfCatalog.UniFamily, expanded: true, autoSort:false },
            [
                {
                    name: 'Glyphs', typeTag: `Custom`, count: mkfData.RangeContent.CountGlyphs,
                    icon: 'text-style', isDynamic: true,
                    fetchList: mkfData.RangeContent.FetchFamilyGlyphAll
                },
                {
                    name: 'Ligatures', typeTag: `Custom`, count: mkfData.RangeContent.CountLiga,
                    icon: 'text-liga', isDynamic: true,
                    fetchList: mkfData.RangeContent.FetchFamilyGlyphLiga
                },
                /*
                {
                    name: 'Components', typeTag: `Custom`, count: mkfData.RangeContent.CountComponents,
                    icon: 'icon', isDynamic: true,
                    fetchList: mkfData.RangeContent.FetchFamilyComponents
                },
                */
                {//TODO : All glyph for full search opportunities
                    name: 'All Unicodes', typeTag: `Custom`, count: mkfData.RangeContent.CountAll,
                    icon: 'text', isDynamic: true,
                    fetchList: mkfData.RangeContent.FetchAllKnowGlyphs
                }
            ]);

        this._specialCatalog._items.forEach((item) => { item.primaryCommand = UNICODE.SetActiveRange; })

        this._InitSelectionStack(false, true);

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'flex',
                'flex-flow': 'column nowrap',
            },
            '.body': {
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'flex': '1 1 auto',
                'min-height': '0',
                'overflow': 'auto',
                'padding': '10px',
                'justify-content': 'flex-start'
            },
            '.item': {
                'flex': '0 0 auto',
                'margin-bottom': '5px'
            }
        }, super._Style());
    }

    _Render() {
        super._Render();
        // Categories
        // Blocks
        // - blocks need to be searchable, there is too much of them.
        this._header = this.Attach(mkfWidgets.InspectorHeader, `header`, this._host);
        this._header.options = { title: `Content browser`, icon: `text-style` };

        this._body = ui.dom.El(`div`, { class: `body` }, this);

        this._specials = this.Attach(nkm.uilib.lists.FolderListRoot, `item`, this._body);
        this._specials.data = this._specialCatalog;
        this._specials.selectionStackOverride = this._selectionStack;

        //this._categories = this.Attach(mkfWidgets.lists.FilterRoot, `asd`, this._body);
        this._categories = this.Attach(nkm.uilib.lists.FolderListRoot, `item`, this._body);
        this._categories.data = UNICODE.instance._categoriesCatalog;
        this._categories.selectionStackOverride = this._selectionStack;

        //this._blocks = this.Attach(mkfWidgets.lists.BlockRoot, `asd`, this._body);
        this._blocks = this.Attach(nkm.uilib.lists.FolderListRoot, `item`, this._body);
        this._blocks.data = UNICODE.instance._blockCatalog;
        this._blocks.selectionStackOverride = this._selectionStack;

    }

}

module.exports = FamilyContentInspector;
ui.Register(`mkf-family-content-inspector`, FamilyContentInspector);