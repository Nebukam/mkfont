'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const io = nkm.io;

class CharDataBlock extends nkm.data.DataBlock {

    constructor() { super(); }

    static NULL = new CharDataBlock();

    _Init() {

        super._Init();

        this._svgString = "";

    }

    get svgString(){ return this._svgString; }
    set svgString(p_svg){
        this._svgString = p_svg;
    }

    _CleanUp() {
        super._CleanUp();
    }


}

module.exports = CharDataBlock;