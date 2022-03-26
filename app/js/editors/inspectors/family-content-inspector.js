const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfCatalog = require(`../../catalogs`);

// Manages what is shown & selectable in the viewport.

const CountGlyphs = (p_family) => {
    return p_family._glyphs.count;
};

const CountLigatures = (p_family) => {
    return p_family._ligatureSet.size;
}

const CountComponents = (p_family) => {
    return 0;
}

const CountAll = (p_family) => {
    return UNICODE.instance._charList.length;
}

class FamilyContentInspector extends nkm.datacontrols.InspectorView {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._specialCatalog = nkm.data.catalogs.CreateFrom(
            { name: 'Family content', localItemClass: mkfCatalog.UniFamily, expanded: true, autoSort:false },
            [
                {
                    name: 'Glyphs', typeTag: `Custom`, count: CountGlyphs,
                    icon: 'text-style', isDynamic: true,
                    fetchList: mkfData.UTILS.GetFamilyUArray
                },
                {
                    name: 'Ligatures', typeTag: `Custom`, count: CountLigatures,
                    icon: 'text-liga', isDynamic: true,
                    fetchList: mkfData.UTILS.GetFamilyLigaUArray
                },
                {
                    name: 'Components', typeTag: `Custom`, count: CountComponents,
                    icon: 'icon', isDynamic: true,
                    fetchList: mkfData.UTILS.GetFamilyComponents
                },
                {//TODO : All glyph for full search opportunities
                    name: 'All', typeTag: `Custom`, count: CountAll,
                    icon: 'text', isDynamic: true,
                    fetchList: mkfData.UTILS.GetAllKnownUArray
                }
            ]);

        this._specialCatalog._items.forEach((item) => { item.primaryCommand = UNICODE.SetDisplayCmd; })
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

        //this._categories = this.Attach(mkfWidgets.lists.FilterRoot, `asd`, this._body);
        this._categories = this.Attach(nkm.uilib.lists.FolderListRoot, `item`, this._body);
        this._categories.data = UNICODE.instance._categoriesCatalog;

        //this._blocks = this.Attach(mkfWidgets.lists.BlockRoot, `asd`, this._body);
        this._blocks = this.Attach(nkm.uilib.lists.FolderListRoot, `item`, this._body);
        this._blocks.data = UNICODE.instance._blockCatalog;

    }

}

module.exports = FamilyContentInspector;
ui.Register(`mkf-family-content-inspector`, FamilyContentInspector);