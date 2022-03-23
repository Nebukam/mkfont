'use strict';

module.exports = {

    serialization: require(`./serialization`),

    ENUMS: require(`./enums`),
    IDS: require(`./ids`),
    IDS_EXT: require(`./ids-ext`),
    UTILS: require(`./utils`),

    SubFamily: require(`./sub-family-data-block`),
    Family: require(`./family-data-block`),
    
    GlyphVariant: require(`./glyph-variant-data-block`),
    Glyph: require(`./glyph-data-block`),

    TransformSettings: require(`./settings-transforms-data-block`),
    ImportSettings: require(`./settings-import-data-block`),

    TTF: require(`./ttf-import`),

}