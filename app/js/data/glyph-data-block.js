'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const io = nkm.io;

class GlyphDataBlock extends nkm.data.DataBlock {

    constructor() { super(); }

    _Init() {

        super._Init();

    }

    _OnExistingReleased(){
        this.existingUser = null;
    }

    // Second profile fetch

    _CleanUp() {
        super._CleanUp();
    }


}

module.exports = GlyphDataBlock;