'use strict';

const nkm = require(`@nkmjs/core`);

class ImportDefinition extends nkm.data.catalogs.CatalogItem {
    constructor() { super(); }

    static __broadcastUpdate = true;

}

module.exports = ImportDefinition;