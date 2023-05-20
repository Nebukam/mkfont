'use strict';

const IDS = require(`./ids`);

const GlyphVariantDataBlock = require(`./glyph-variant-data-block`);

const base = GlyphVariantDataBlock;
class GlyphVariantRef extends base {

    constructor() { super(); }

    static __VALUES = this.Ext(base.__VALUES, {
        [IDS.SHOW_ALL_LAYERS]: { value: false }
    });

}

module.exports = nkm.data.SIMPLEX.Export(GlyphVariantRef);