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

        this.Add(
            {
                context: nkm.data.catalogs.Catalog,
                kvps: [
                    { key: mkfData.Glyph, binding: mkfData.Slot },
                ]
            },
            {
                context: mkfWidgets.lists.UniCategoryGroup,
                kvps: [
                    { key: mkfCatalogs.UniCategory, binding: mkfWidgets.lists.UniCategory },
                    { key: mkfCatalogs.UniCategoryGroup, binding: mkfWidgets.lists.UniCategoryGroup },
                ]
            },
            {
                context: nkm.uilib.lists.FolderListRoot,
                kvps: [
                    { key: mkfCatalogs.UniCategory, binding: mkfWidgets.lists.UniCategory },
                    { key: mkfCatalogs.UniCategoryGroup, binding: mkfWidgets.lists.UniCategoryGroup },
                ]
            },
            {
                context: nkm.datacontrols.CONTEXT.DEFAULT_EDITOR,
                kvps: [
                    { key: mkfData.Family, binding: mkfEditors.FontEditor },
                ]
            },
            {
                context: nkm.datacontrols.CONTEXT.INSPECTOR,
                kvps: [
                    { key: mkfData.Glyph, binding: mkfEditors.inspectors.Glyph },
                    { key: mkfData.Slot, binding: mkfEditors.inspectors.Glyph },
                    { key: mkfData.SubFamily, binding: mkfEditors.inspectors.SubFamily },
                ]
            },
            {
                context: nkm.data.serialization.CONTEXT.JSON,
                kvps: [
                    { key: mkfData.Family, binding: mkfData.serialization.json.Family },
                    { key: mkfData.Prefs, binding: mkfData.serialization.json.SimpleDataEx }
                ]
            },
            {
                context: nkm.documents.CONTEXT.DOCUMENT,
                kvps: [
                    { key: mkfData.Family, binding: nkm.documents.bound.JSONDocument }
                ]
            });

    }
}

module.exports = Bindings;