'use strict';

module.exports = {

    s11n: require(`./s11n`),

    ENUMS: require(`./enums`),
    IDS: require(`./ids`),
    IDS_EXT: require(`./ids-ext`),
    IDS_PREFS: require(`./ids-prefs`),
    INFOS: require(`./infos`),
    UTILS: require(`./utils`),

    AppSettings: require(`./app-settings`),

    Family: require(`./family-data-block`),
    
    GlyphLayer: require(`./glyph-layer-data-block`),
    GlyphVariant: require(`./glyph-variant-data-block`),
    Glyph: require(`./glyph-data-block`),

    TransformSettings: require(`./settings-transforms-data-block`),
    ImportSettings: require(`./settings-import-data-block`),
    LigaImportSettings: require(`./settings-liga-import-data-block`),
    SearchSettings : require(`./settings-search-data-block`),

    RangeContent : require(`./range-content`),

    TTF: require(`./ttf-import`),

}