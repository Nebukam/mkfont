'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const io = nkm.io;

class FontDataBlock extends nkm.data.DataBlock {

    constructor() { super(); }

    _Init() {

        super._Init();

        this._glyphs = new nkm.collections.List();

        // Font data : only holds Glyph data.
        // The editor is responsible for making the "connection" between
        // which glyph belong to which group/foldout and distribute UI elements
        // accordingly.

    }

    _OnExistingReleased(){
        this.existingUser = null;
    }

    // Second profile fetch

    _CleanUp() {
        super._CleanUp();
    }


}

module.exports = FontDataBlock;