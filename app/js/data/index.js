'use strict';

const GlyphLayer = require(`./glyph-layer-data-block`);

const __UTILS = require(`./utils`);
__UTILS.__layerClass = GlyphLayer;

module.exports = {

    serialization: require(`./serialization`),

    ENUMS: require(`./enums`),
    IDS: require(`./ids`),
    IDS_EXT: require(`./ids-ext`),
    IDS_PREFS: require(`./ids-prefs`),
    UTILS: __UTILS,

    Family: require(`./family-data-block`),
    
    GlyphLayer: GlyphLayer,
    GlyphVariant: require(`./glyph-variant-data-block`),
    Glyph: require(`./glyph-data-block`),

    TransformSettings: require(`./settings-transforms-data-block`),
    ImportSettings: require(`./settings-import-data-block`),
    LigaImportSettings: require(`./settings-liga-import-data-block`),
    Prefs: require(`./settings-preferences`),

    RangeContent : require(`./range-content`),

    TTF: require(`./ttf-import`),

}