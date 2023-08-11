'use strict';
const nkm = require(`@nkmjs/core`);

module.exports = {

    SetAscent: require(`./action-set-ascent`),
    SetEM: require(`./action-set-em`),
    SetLayerIndex: require(`./action-set-layer-index`),
    SetLayerControl: require(`./action-set-layer-control`),
    GlyphCreate: require(`./action-glyph-create`),
    GlyphDelete: require(`./action-glyph-delete`),
    LayerAdd: require(`./action-layer-add`),
    LayerRemove: require(`./action-layer-remove`),

    SetProperty: nkm.data.ops.actions.SetPropertyValue,
    SetPropertyMultiple: nkm.data.ops.actions.SetPropertyMultiple,

}