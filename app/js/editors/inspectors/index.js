'use strict';

module.exports = {

    Display: require(`./display-inspector`),

    Family: require(`./family-inspector`),
    FamilyMetrics: require(`./family-metrics-inspector`),
    FamilyContent: require(`./family-content-inspector`),
    FamilyActions: require(`./family-actions-inspector`),

    Glyph: require(`./glyph-inspector`),
    GlyphList: require(`./glyph-list-inspector`),
    GlyphInspectorPlaceholder: require(`./glyph-inspector-placeholder`),

    Pangram: require(`./pangram-inspector`),

    TransformSettings: require(`./tr-settings-inspector`),
    TransformSettingsSilent: require(`./tr-settings-silent-inspector`),

}