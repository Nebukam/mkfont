'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const CmdSetActiveRange = require(`./operations/commands/cmd-set-active-range`);
const UniBlock = require(`./catalogs/definition-uni-block`);
const UniCategory = require(`./catalogs/definition-uni-cat`);
const UniCategoryGroup = require(`./catalogs/definition-uni-cat-group`);

const _setActivateRangeCMD = new CmdSetActiveRange();

class UNICODE extends nkm.com.Observable {
    constructor() { super(); }

    get SetActiveRange() { return _setActivateRangeCMD; }

    get MAX_GLYPH_COUNT() { return 65534; }

    _Init() {

        super._Init();

        let c = UNI_CATEGORIES;
        this._categories = c;

        let gc = UNI_GENERAL_CATEGORIES;
        this._generalCategories = gc;

        let mgc = [];
        for (let p in gc) {
            let lgc = gc[p], subs = lgc.subs,
                cgc = { name: lgc.name, itemClass: UniCategoryGroup, autoSort: false, content: [] };
            for (let i = 0; i < subs.length; i++) {
                let lcgc = subs[i];
                lcgc.parent = lgc;
                lcgc.primaryCommand = this.SetActiveRange;
                lcgc.itemClass = UniCategory;
                cgc.content.push(lcgc);
            }
            mgc.push(cgc);
        }

        let b = UNI_BLOCKS;

        b.forEach((obj) => {
            obj.itemClass = UniBlock;
            obj.primaryCommand = this.SetActiveRange;
        });

        this._blocks = b;
        this._blockCatalog = nkm.data.catalogs.CreateFrom({ name: `Unicode blocks`, autoSort: false }, b);
        this._blockCatalog.expanded = true;

        this._categoriesCatalog = nkm.data.catalogs.CreateFrom({ name: `Categories`, autoSort: false }, mgc);
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
            char.char = this.GetUnicodeCharacter(parseInt(cid, 16));
        }

        //let relMap = UNI_REL_MAPPING;

    }

    GetInfos(p_unicode, p_createLigature = false) {

        let data = null;

        if (u.isArray(p_unicode)) {
            data = p_unicode.length == 1 ?
                this.GetSingle(p_unicode[0]) :
                this.GetLigature(p_unicode, p_createLigature);
        } else {
            data = this._charMap[p_unicode];
        }

        return data || null;

    }

    GetSingle(p_lookup) {

        if (u.isNumber(p_lookup)) { p_lookup = p_lookup.toString(16).padStart(4, `0`); }

        let result = this._charMap[this.GetLookup(p_lookup)];
        if (!result) {
            let isHex = u.isHex(p_lookup, 4);
            if (isHex) {

                let
                    uid = `${p_lookup}`,
                    index = parseInt(uid, 16),
                    list = this._blocks,
                    ownerBlock = null;

                result = {
                    name: 'UNKNOWN',
                    u: p_lookup,
                    i: -1,
                    block: null,
                    char: this.GetUnicodeCharacter(index)
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
                else { console.error(`p_lookup = ${p_lookup} / index : ${index}`); }

                this._charMap[uid] = result;

            }
        }
        return result;
    }

    GetLigature(p_lookups, p_create = true) {

        let lps = [];
        p_lookups.forEach((item) => { lps.push(this.GetLookup(item)); });
        let
            ligatureLookup = lps.join(`+`),
            ligature = this._charMap[ligatureLookup];

        if (!ligature) {
            if (!p_create) { return null; }
            let charPts = [];

            lps.forEach((item) => { charPts.push(this.GetUnicodeCharacter(parseInt(item, 16))); });
            charPts = charPts.join('');

            ligature = { u: ligatureLookup, name: `LIGATURE ${charPts}`, cat: this._categories.Liga, ligature: true, char: charPts };
            this._charMap[ligatureLookup] = ligature;
        }

        return ligature;

    }

    GetAddress(p_character) {
        return p_character.codePointAt(0).toString(16).padStart(4, '0');
    }

    GetUnicodeCharacter(p_codePoint) {

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
    GetLookup(p_infos) {

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

    UUni(p_infos) {
        if (p_infos.ligature) {
            let ulist = p_infos.u.split(`+`);
            for (let i = 0; i < ulist.length; i++) { ulist[i] = `U+${ulist[i]}`; }
            return ulist.join(``);
        } else {
            return `U+${p_infos.u}`;
        }
    }

    GetAddressesFromText(p_text, p_ignoreLigatures = true) {
        let result = [];
        if (true) { //p_ignoreLigatures
            for (let i = 0; i < p_text.length; i++) {
                let address = this.GetAddress(p_text.substring(i, i + 1));
                if (result.includes(address)) { continue; }
                result.push(address);
            }
        } else {
            //TODO : Implement ligature lookup
        }

        return result;
    }

    /**
     * 
     * @param {string} p_string accepts : 'a', 'abc', 'aU+0000', 'abcU+0000', 'U+0000U+0000U+0000', 'U+0000-abU+0000U+0000'
     * @returns 
     */
    TryGetInfosFromString(p_string, p_createLigature = false, p_sep = `-`) {

        if (!p_string || p_string == ``) { return null; }

        let
            glyphInfos = null,
            resolved = this.ResolveString(p_string, p_sep),
            unicodes = [];


        for (let i = 0; i < resolved.length; i++) {
            let uchar = resolved.substr(i, 1);
            if (uchar == ``) { continue; }
            unicodes.push(this.GetAddress(uchar));
        }

        glyphInfos = this.GetInfos(unicodes, p_createLigature);
        unicodes.length = 0;
        unicodes = null;

        return glyphInfos;

    }

    /**
     * 
     * @param {string} p_string accepts : 'a', 'abc', 'aU+0000', 'abcU+0000', 'U+0000U+0000U+0000', 'U+0000-abU+0000U+0000'
     * @returns 
     */
    ResolveString(p_string, p_sep = `-`) {

        if (!p_string || p_string == ``) { return ``; }

        let
            glyphInfos = null,
            result = ``;

        if (p_string.includes(`U+`)) {
            let chunks = p_string.split(`U+`);

            if (chunks.length >= 2) { // Prefixed chars : ...U+...
                let prefix = chunks.shift();
                if (prefix != '') { result += prefix; }
            }

            for (let i = 0; i < chunks.length; i++) {

                let uchar = chunks[i];
                if (uchar == ``) { continue; }

                let
                    cSplit = uchar.split(p_sep),
                    uHex = cSplit.shift(),//extract what should be '0000'
                    cPt = Number.parseInt(uHex, 16);

                if (!Number.isNaN(cPt)) { result += String.fromCodePoint(cPt); }
                else { result += `U+${uHex}`; }

                if (cSplit.length == 0) { continue; }
                if (cSplit.length == 1 && cSplit[0] == ``) { continue; } // Trailing separator : U+0000-

                result += cSplit.join(p_sep);

            }
        } else {
            result += p_string;
        }

        return result;

    }

}

module.exports = new UNICODE();