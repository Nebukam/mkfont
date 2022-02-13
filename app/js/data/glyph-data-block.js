'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const io = nkm.io;

class GlyphDataBlock extends nkm.data.DataBlock {

    constructor() { super(); }

    static NULL = new GlyphDataBlock();

    _Init() {

        super._Init();
        
        this._decimal = [];



    }
    
    get isLigature(){
        return this._decimal.length > 1;
    }

    set decimal(p_decimals){
        if(u.isNumber(p_decimals)){
            this._decimal = [p_decimals];
        }else if(u.isArray(p_decimals)){
            this._decimal = [...p_decimals];
        }
    }

    get unicode(){
        let hexes = [];
        for (let i = 0; i < this._decimal.length; i++) {
            let
                decimal = this._decimal[i],
                hex = decimal.toString(16).padStart(4, '0');
            hexes.push(`u${hex}`);
        }
        return hexes;
    }

    _CleanUp() {
        super._CleanUp();
    }


}

module.exports = GlyphDataBlock;