'use strict';

const nkm = require(`@nkmjs/core`);

class Unicodes extends nkm.com.helpers.Singleton {
    constructor() { super(); }

    _Init() {
        super._Init();


        let ranges = [
            //this._Range(`ASCII Control characters`, [0, 31, 127, 159]),
            this._Range(`Basic Latin`, [32, 126]),
            this._Range(`Latin 1 - Supplement`, [160, 255]),
            //this._Range(`Latin Extended A`, [256, 383]),
            //this._Range(`Latin Extended B`, [384, 591]),
            //this._Range(`Latin Extended Additional`, ['\u1E00'.charCodeAt(0), '\u1EFF'.charCodeAt(0)]),
        ];

        this._ranges = nkm.data.catalogs.CreateFrom({ name:`Font references` }, ranges);

    }

    _Range(p_name, p_ranges, p_customs = null) {

        let
            content = [],
            range = { name: p_name, content: content };

        for (let r = 0; r < p_ranges.length; r += 2) {
            let start = p_ranges[r], end = p_ranges[r + 1];
            for (let i = start; i < end; i++) {
                content.push(this._Single(i));
            }
        }

        if (p_customs) {
            for (let i = 0; i < p_customs.length; i++) {
                content.push(this._Single(p_customs[i]));
            }
        }

        return range;

    }

    _Single(p_decimal) {

        let
            hex = p_decimal.toString(16).padStart(4, '0'),
            char = String.fromCharCode(p_decimal);

        return {
            name: char,
            decimal: p_decimal,
            hex: `u${hex}`,
            glyph: char
        };

    }

    _Ligature(p_string) {

        let hexes = [];
        for (let i = 0; i < p_string.length; i++) {
            let
                decimal = p_string.charCodeAt(i),
                hex = decimal.toString(16).padStart(4, '0');
            hexes.push(hex);
        }

        return {
            name: p_string,
            decimal: -1,
            hex: hexes,
            glyph: p_string
        };

    }

}

module.exports = Unicodes;