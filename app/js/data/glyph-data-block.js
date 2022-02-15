'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const io = nkm.io;

const SIGNAL = require(`./signal`);

const GlyphVariant = require(`./glyph-variant-data-block`);

class GlyphDataBlock extends nkm.data.DataBlock {

    constructor() { super(); }

    static NULL = new GlyphDataBlock();

    _Init() {

        super._Init();

        this._parentFont = null;

        this._arabic_form = null;
        this._address = [];
        this._addressID = ``;

        this._decimal = [];
        this._defaultVariant = new GlyphVariant();

    }

    set parentFont(p_value) { this._parentFont = p_value; }
    get parentFont() { return this._parentFont; }

    get isLigature() { return this._address.length > 1; }

    get svg() { return this._defaultVariant.svgString; }
    set svg(p_value) {
        this._defaultVariant.svgString = p_value;
        //console.log(`svg string -> `, p_value);
        this.CommitUpdate();
    }

    get address() { return this._address; }
    set address(p_value) {
        let address = [];
        if (u.isArray(p_value)) {
            for (let i = 0; i < p_value.length; i++) {
                let single = p_value[i];
                if (u.isString(single)) {
                    if (single.length == 1) {
                        // Single glyph, get CharCode
                        address.push(single.charCodeAt(0).toString(16).padStart(4, '0'));
                    } else {
                        // Chain, will be custom ligature
                        for (let s = 0; s < single.length; s++) {
                            address.push(single.charCodeAt(s).toString(16).padStart(4, '0'));
                        }
                    }
                } else if (u.isNumber(single)) {
                    // Convert to hex
                    address.push(single.toString(16).padStart(4, '0'));
                }

            }
        } else if (u.isString(p_value)) {
            if (single.length == 1) {
                // Single glyph, get CharCode
                address.push(single.charCodeAt(0).toString(16).padStart(4, '0'));
            } else {
                // Chain, will be custom ligature
                for (let s = 0; s < single.length; s++) {
                    address.push(single.charCodeAt(s).toString(16).padStart(4, '0'));
                }
            }
        } else if (u.isNumber(p_value)) {
            address.push(single.toString(16).padStart(4, '0'));
        }

        let
            oldAddress = this._address,
            oldAddressID = this._addressID;

        this._address = address;
        this._addressID = address.length == 0 ? `` : `u${address.join(`u`)}`;

        this._Broadcast(SIGNAL.ADDRESS_CHANGED, this, oldAddress, oldAddressID);
        this.CommitUpdate();

    }

    get addressID() { return this._addressID; }

    _CleanUp() {
        this.parentFont = null;
        this._address = [];
        this._addressID = ``;
        super._CleanUp();
    }


}

module.exports = GlyphDataBlock;