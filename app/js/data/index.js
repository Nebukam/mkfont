'use strict';

const Glyph = require(`./glyph-data-block`);
Glyph.NULL.Set('glyph-name', `NULL`);

module.exports = {

    SIGNAL: require(`./signal`),
    IDS: require(`./ids`),

    SubFamily: require(`./sub-family-data-block`),
    Family: require(`./family-data-block`),
    
    GlyphVariant: require(`./glyph-variant-data-block`),
    Glyph: Glyph

}