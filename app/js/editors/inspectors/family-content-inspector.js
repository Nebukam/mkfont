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

class FamilyContentInspector extends nkm.datacontrols.InspectorView {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._specialCatalog = nkm.data.catalogs.CreateFrom(
            { name: 'Family content', localItemClass: mkfCatalog.UniFamily, expanded: true },
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
        this._header = this.Add(mkfWidgets.InspectorHeader, `header`, this._host);
        this._header.options = { title: `Content browser`, icon: `text-style` };

        this._body = ui.dom.El(`div`, { class: `body` }, this);

        this._specials = this.Add(nkm.uilib.lists.FolderListRoot, `item`, this._body);
        this._specials.data = this._specialCatalog;

        //this._categories = this.Add(mkfWidgets.lists.FilterRoot, `asd`, this._body);
        this._categories = this.Add(nkm.uilib.lists.FolderListRoot, `item`, this._body);
        this._categories.data = UNICODE.instance._categoriesCatalog;

        //this._blocks = this.Add(mkfWidgets.lists.BlockRoot, `asd`, this._body);
        this._blocks = this.Add(nkm.uilib.lists.FolderListRoot, `item`, this._body);
        this._blocks.data = UNICODE.instance._blockCatalog;

    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        console.log(`FAMILY CONTENT`, this._data);
    }

}

module.exports = FamilyContentInspector;
ui.Register(`mkf-family-content-inspector`, FamilyContentInspector);