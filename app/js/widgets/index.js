'use strict';

module.exports = {

    importation:require(`./importation`),
    lists:require(`./lists`),

    GlyphSlot : require(`./glyph-slot`),
    GlyphCanvasRenderer : require(`./glyph-canvas-renderer`),
    GlyphPreview: require(`./glyph-preview`),
    GlyphIdentity: require(`./glyph-identity`),
    PropertyControl: require(`./property-control`),
    PangramRenderer: require(`./pangram-renderer`),
    ControlHeader: require(`./control-header`),
    InspectorHeader: require(`./inspector-header`),
    SearchStatus: require(`./search-status`),
    LigaButton: require(`./liga-button`),
    FamilyGlyphMonitor: require(`./family-glyph-monitor`),
    ResourceBinding: require(`./resource-binding`),
    LayerTransformSettings: require(`./tr-layer-inspector`),
    LayersView:require(`./layers-view`),
}