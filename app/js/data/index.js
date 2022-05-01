'use strict';

module.exports = {

    serialization: require(`./serialization`),

    ENUMS: require(`./enums`),
    IDS: require(`./ids`),
    IDS_EXT: require(`./ids-ext`),
    IDS_PREFS: require(`./ids-prefs`),
    UTILS: require(`./utils`),

    Family: require(`./family-data-block`),
    
    GlyphLayer: require(`./glyph-layer-data-block`),
    GlyphVariant: require(`./glyph-variant-data-block`),
    Glyph: require(`./glyph-data-block`),

    TransformSettings: require(`./settings-transforms-data-block`),
    ImportSettings: require(`./settings-import-data-block`),
    LigaImportSettings: require(`./settings-liga-import-data-block`),
    LayerTransforms: require(`./layer-transforms-data-block`),
    Prefs: require(`./settings-preferences`),

    RangeContent : require(`./range-content`),

    TTF: require(`./ttf-import`),

}