'use strict';

module.exports = {

    IDS: require(`./ids`),

    SubFamily: require(`./sub-family-data-block`),
    Family: require(`./family-data-block`),
    
    GlyphVariant: require(`./glyph-variant-data-block`),
    Glyph: require(`./glyph-data-block`),

    TransformSettings: require(`./tr-settings-data-block`),
    ImportSettings: require(`./import-settings-data-block`),

    TTF: require(`./ttf-import`),

}