'use strict';

const nkm = require(`@nkmjs/core`);
const mkfData = require(`./data`);

class UNICODE extends nkm.com.helpers.Singleton {
    constructor() { super(); }

    _Init() {

        super._Init();

        let b = UNI_BLOCKS;
        this._blocks = b;

        let c = UNI_CATEGORIES;
        this._categories = c;

        let gc = UNI_GENERAL_CATEGORIES;
        this._generalCategories = gc;

        for (var g in gc) {
            let gCat = gc[g], childrens = gCat.childrens;
            for (let i = 0; i < childrens.length; i++) { childrens[i].general = gCat; }
        }

        let k = UNI_CANON;
        this._canonicalClasses = k;

        this._charMap = UNI_CHAR_MAP;

    }

    static GetSingle(p_unicode) {
        let address = p_unicode.charCodeAt(0).toString(16).padStart(4, '0');
        return this.instance._charMap[address];
    }

}

module.exports = UNICODE;