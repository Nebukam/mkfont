'use strict';

module.exports = {

    SIGNAL: require(`./signal`),
    IDS: require(`./ids`),

    SubFamily: require(`./sub-family-data-block`),
    Family: require(`./family-data-block`),
    
    GlyphVariant: require(`./glyph-variant-data-block`),
    Glyph: require(`./glyph-data-block`),
        
    Slot: require(`./slot-catalog-item`)

}