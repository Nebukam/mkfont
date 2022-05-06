'use strict';

const nkm = require(`@nkmjs/core`);
const UniCategory = require(`./definition-uni-cat`);

class UniCategoryGroupDefinition extends nkm.data.catalogs.Catalog {
    constructor() { super(); }
    Wake(){
        this._localItemClass = UniCategory;
    }
}

module.exports = UniCategoryGroupDefinition;