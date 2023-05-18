'use strict';

const nkm = require("@nkmjs/core");
const mkfEditors = require(`./editors`);
const mkfData = require(`./data`);
const mkfCatalogs = require(`./catalogs`);
const mkfWidgets = require(`./widgets`);

class Bindings extends nkm.com.helpers.BindingKit {
    constructor() { super(); }
    _Init() {
        super._Init();

        this.AddClasses(
            mkfData.Family
        );

        let unicodeInfos = { name: 1, u: 1, char: 1 };

        this.Add(
            {
                ctx: nkm.data.catalogs.Catalog,
                kvps: [
                    { key: mkfData.Glyph, binding: mkfData.Slot },
                ]
            },
            {
                ctx: mkfWidgets.lists.UniCategoryGroup,
                kvps: [
                    { key: mkfCatalogs.UniCategory, binding: mkfWidgets.lists.UniCategory },
                    { key: mkfCatalogs.UniCategoryGroup, binding: mkfWidgets.lists.UniCategoryGroup },
                ]
            },
            {
                ctx: nkm.uilib.lists.FolderListRoot,
                kvps: [
                    { key: mkfCatalogs.UniCategory, binding: mkfWidgets.lists.UniCategory },
                    { key: mkfCatalogs.UniCategoryGroup, binding: mkfWidgets.lists.UniCategoryGroup },
                ]
            },
            {
                ctx: nkm.datacontrols.CTX.DEFAULT_INSPECTOR,
                kvps: [
                    {
                        key: mkfData.Glyph, keys: unicodeInfos,
                        binding: mkfEditors.inspectors.Glyph
                    }
                ]
            },
            {
                ctx: nkm.datacontrols.CTX.DEFAULT_LIST_INSPECTOR,
                kvps: [
                    {
                        key: mkfData.Glyph, keys: unicodeInfos,
                        binding: mkfEditors.inspectors.GlyphList
                    },
                ]
            },
            {
                ctx: nkm.data.s11n.CTX.JSON,
                kvps: [
                    { key: mkfData.Family, binding: mkfData.s11n.json.Family },
                    { key: mkfData.Prefs, binding: mkfData.s11n.json.FontObjectData }
                ]
            },
            {
                ctx: nkm.documents.CTX.DOCUMENT,
                kvps: [
                    { key: mkfData.Family, binding: nkm.documents.bound.JSONDocument }
                ]
            });

    }
}

module.exports = Bindings;