'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const io = nkm.io;

const CharDataBlock = require(`./char-data-block`);

class GlyphDataBlock extends nkm.data.DataBlock {

    constructor() { super(); }

    static NULL = new GlyphDataBlock();

    _Init() {

        super._Init();
        
        this._decimal = [];
        this._defaultChar = new CharDataBlock();

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

    get svg(){ return this._defaultChar.svgString; }
    set svg(p_value){ 
        this._defaultChar.svgString = p_value; 
        console.log(`svg string -> `, p_value);
        this.CommitUpdate();
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