'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const mkfData = require(`./data`);
const CmdSetDisplay = require(`./operations/commands/cmd-set-display-list`);
const UniBlock = require(`./catalogs/definition-uni-block`);
const UniCategory = require(`./catalogs/definition-uni-cat`);

class UNICODE extends nkm.com.helpers.Singleton {
    constructor() { super(); }

    _Init() {

        super._Init();

        let setDisplayCmd = new CmdSetDisplay();

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
                lcgc.primaryCommand = setDisplayCmd;
                lcgc.itemClass = UniCategory;
                cgc.content.push(lcgc);
            }
            mgc.push(cgc);
        }

        let b = UNI_BLOCKS;

        b.forEach((obj) =>{ 
            obj.itemClass = UniBlock;
            obj.primaryCommand = setDisplayCmd;
        });

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

        for (let cid in cMap) {
            let char = cMap[cid];
            this._charList[char.i] = char;
        }

    }

    static GetSingle(p_lookup) {

        if (u.isNumber(p_lookup)) { p_lookup = p_lookup.toString(16).padStart(4, `0`); }

        let result = this.instance._charMap[this.GetLookup(p_lookup)];
        if (!result) {
            let isHex = u.isHex(p_lookup, 4);
            if (isHex) {

                let
                    index = parseInt(`${p_lookup}`, 16),
                    list = this.instance._blocks,
                    ownerBlock = null;

                result = {
                    name: 'UNKNOWN',
                    u: p_lookup,
                    i: -1,
                    block: null
                };

                for (let i = 0, n = list.length; i < n; i++) {
                    let block = list[i],
                        start = block.start,
                        end = start + block.count;
                    if (index >= start && index < end) {
                        ownerBlock = block;
                        break;
                    }
                }

                if (ownerBlock) { result.block = ownerBlock; }
                else{ console.error(`p_lookup = ${p_lookup} / index : ${index}`); }

            }
        }
        return result;
    }

    static GetAddress(p_character) {
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

    /**
     * Attempts to find existing glyphs from UNICODE infos
     * @param {*} p_infos 
     */
    static GetLookup(p_infos) {

        let lookup = null;

        if (u.isNumber(p_infos)) {
            lookup = p_infos.toString(16).padStart(4, `0`);
        } else if (u.isString(p_infos)) {
            if (u.isHex(p_infos, 4)) { lookup = p_infos.toLowerCase(); }
            else { lookup = p_infos; }
        } else if (u.isObject(p_infos)) {
            lookup = p_infos.u;
        }

        return lookup;
    }

}

module.exports = UNICODE;