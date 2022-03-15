'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const mkfData = require(`../../data`);

class ActionSetPathData extends actions.Action {
    constructor() { super(); }

    // Expected operation format : { variant:GlyphVariantDataBlock, path:pathData }

    _InternalDo(p_operation, p_merge = false) {

        let
            glyphVariant = p_operation.variant,
            oldPathData = glyphVariant.Get(mkfData.IDS.PATH_DATA);

        glyphVariant.Set(mkfData.IDS.PATH_DATA, p_operation.path);

        p_operation.oldPathData = oldPathData; // Store old path data

    }

    _InternalUndo() {
        // if prevSvgString == null, release glyph, it was NULL before.
    }

    _InternalRedo() {

    }

}

module.exports = ActionSetPathData;