'use strict';

const nkm = require(`@nkmjs/core`);
const mkfData = require(`./data`);

class UNICODE extends nkm.com.helpers.Singleton {
    constructor() { super(); }

    _Init() {

        super._Init();

        let c = UNI_CATEGORIES;
        this._categories = c;

        let gc = UNI_GENERAL_CATEGORIES;
        this._generalCategories = gc;

        let mgc = [];
        for (let p in gc) {
            let lgc = gc[p], childrens = lgc.childrens,
                cgc = { name: lgc.name, content: [] };
            for (let i = 0; i < childrens.length; i++) {
                let lcgc = childrens[i];
                cgc.content.push({ name: lcgc.name });
            }
        }

        let b = UNI_BLOCKS;
        this._blocks = b;
        this._blockCatalog = nkm.data.catalogs.CreateFrom(
            { name: `Unicode blocks` }, b);

        this._categoriesCatalog = nkm.data.catalogs.CreateFrom(
            { name: `Categories` }, mgc);

        for (var g in gc) {
            let gCat = gc[g], childrens = gCat.childrens;
            for (let i = 0; i < childrens.length; i++) { childrens[i].general = gCat; }
        }

        let k = UNI_CANON;
        this._canonicalClasses = k;

        let cMap = UNI_CHAR_MAP;
        this._charMap = cMap;
        this._charList = [];

        for(let cid in cMap){
            let char = cMap[cid];
            this._charList[char.i] = char;
        }

    }

    static GetSingle(p_unicode) {
        let address = p_unicode.charCodeAt(0).toString(16).padStart(4, '0');
        return this.instance._charMap[address];
    }

}

module.exports = UNICODE;