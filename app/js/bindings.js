'use strict';

const nkm = require("@nkmjs/core");
const mkfInspectors = require(`./editors/inspectors`);
const mkfData = require(`./data`);
const mkfCatalogs = require(`./catalogs`);
const mkfWidgets = require(`./widgets`);

class Bindings extends nkm.com.helpers.BindingKit {
    constructor() { super(); }
    _Init() {
        super._Init();

        this.Add(
            {
                context: nkm.data.catalogs.Catalog,
                kvps: [
                    { key: mkfData.Glyph, binding: mkfData.Slot },
                ]
            },
            {
                context: nkm.uilib.lists.FolderList,
                kvps: [
                    { key: mkfCatalogs.UniCategory, binding: mkfWidgets.lists.UniCategory },
                ]
            },
            {
                context: nkm.uicontrols.CONTEXT.INSPECTOR,
                kvps: [
                    { key: mkfData.Glyph, binding: mkfInspectors.Glyph },
                    { key: mkfData.Slot, binding: mkfInspectors.Glyph },
                    { key: mkfData.SubFamily, binding: mkfInspectors.SubFamily },
                ]
            },
            {
                context: nkm.data.serialization.CONTEXT.JSON,
                kvps: [
                    { key: mkfData.Family, binding: mkfData.serialization.json.Family }
                ]
            });

    }
}

module.exports = Bindings;