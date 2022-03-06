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
            let lgc = gc[p], subs = lgc.subs,
                cgc = { name: lgc.name, content: [] };
            for (let i = 0; i < subs.length; i++) {
                let lcgc = subs[i];
                lcgc.parent = lgc;
                cgc.content.push(lcgc);
            }
            mgc.push(cgc);
        }

        let b = UNI_BLOCKS;
        this._blocks = b;
        this._blockCatalog = nkm.data.catalogs.CreateFrom({ name: `Unicode blocks` }, b);
        this._blockCatalog.expanded = true;

        this._categoriesCatalog = nkm.data.catalogs.CreateFrom({ name: `Categories` }, mgc);
        this._categoriesCatalog.expanded = true;

        for (var g in gc) {
            let gCat = gc[g], subs = gCat.subs;
            for (let i = 0; i < subs.length; i++) { subs[i].general = gCat; }
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

    static GetSingle(p_character) {
        return this.instance._charMap[this.GetAdress(p_character)];
    }

    static GetAddress(p_character){
        return p_character.codePointAt(0).toString(16).padStart(4, '0');
    }

    static GetUnicodeCharacter(p_codePoint) {

        if (p_codePoint >= 0 && p_codePoint <= 0xD7FF || p_codePoint >= 0xE000 && p_codePoint <= 0xFFFF) {
            return String.fromCharCode(p_codePoint);
        } else if (p_codePoint >= 0x10000 && p_codePoint <= 0x10FFFF) {
    
            // we substract 0x10000 from cp to get a 20-bits number
            // in the range 0..0xFFFF
            p_codePoint -= 0x10000;
    
            // we add 0xD800 to the number formed by the first 10 bits
            // to give the first byte
            var first = ((0xffc00 & p_codePoint) >> 10) + 0xD800
    
            // we add 0xDC00 to the number formed by the low 10 bits
            // to give the second byte
            var second = (0x3ff & p_codePoint) + 0xDC00;
    
            return String.fromCharCode(first) + String.fromCharCode(second);
        }
    }

}

module.exports = UNICODE;