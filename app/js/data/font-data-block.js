'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const io = nkm.io;

const SIGNAL = require(`./signal`);

const FontVariant = require(`./font-variant-data-block`);

class FontDataBlock extends nkm.data.DataBlock {

    constructor() { super(); }

    _Init() {

        super._Init();

        this._variants = new nkm.collections.List();
        this._defaultVariant = new FontVariant();
        this._defaultVariant._isDefault = true;
        this.AddVariant(this._defaultVariant);

        this._viewBox = { x: 0, y: 0, width: 100, height: 100 };
        this._glyphs = new nkm.collections.List();

        // Font data : only holds Glyph data.
        // The editor is responsible for making the "connection" between
        // which glyph belong to which group/foldout and distribute UI elements
        // accordingly.

    }

    get viewBox() { return this._viewBox; }
    set viewBox(p_value) {
        this._viewBox = p_value;
        // Dispatch viewBox update evt
    }

    AddVariant(p_variant){
        if(!this._variants.Add(p_variant)){return;}
        for(let i = 0, n = this._glyphs.count; i < n; i++){
            let g = this._glyphs[i];
            g.AddVariant(p_variant);
        }
    }

    RemoveVariant(p_variant){
        if(!this._variants.Remove(p_variant)){return;}
        for(let i = 0, n = this._glyphs.count; i < n; i++){
            let g = this._glyphs[i];
            g.RemoveVariant(p_variant);
        }
    }

    AddGlyph(p_glyph) {
        p_glyph.parentFont = this;
        if (!this._glyphs.Add(p_glyph)) { return; }
        p_glyph.Watch(SIGNAL.ADDRESS_CHANGED, this._OnGlyphAddressChanged);
        this._Broadcast(nkm.com.SIGNAL.ITEM_ADDED, this, p_glyph);
    }

    RemoveGlyph(p_glyph) {
        let g = this._glyphs.Remove(p_glyph);
        if (!g) { return; }
        p_glyph.Unwatch(SIGNAL.ADDRESS_CHANGED, this._OnGlyphAddressChanged);
        this._Broadcast(nkm.com.SIGNAL.ITEM_REMOVED, this, g);
    }

    _CleanUp() {
        super._CleanUp();
    }


}

module.exports = FontDataBlock;