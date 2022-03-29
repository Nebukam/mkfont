const nkm = require(`@nkmjs/core`);

class LigaImportDefinition extends nkm.data.catalogs.CatalogItem {
    constructor() { super(); }

    static __broadcastUpdate = true;

}

module.exports = LigaImportDefinition;