'use strict';

const nkm = require("@nkmjs/core");
const mkfInspectors = require(`./editors/inspectors`);
const mkfData = require(`./data`);

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
                context: nkm.uicontrols.CONTEXT.INSPECTOR,
                kvps: [
                    { key: mkfData.Glyph, binding: mkfInspectors.Glyph },
                    { key: mkfData.Slot, binding: mkfInspectors.Glyph },
                ]
            });

    }
}

module.exports = Bindings;