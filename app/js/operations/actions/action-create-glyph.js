'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const mkfData = require(`../../data`);

class ActionCreateGlyph extends actions.Action {
    constructor() { super(); }

    // Expected operation format : { family:FamilyDataBlock, unicode:`abc`, path:pathData }

    _InternalDo(p_operation, p_merge = false) {

        let
            newGlyph = new mkfData.Glyph(),
            glyphVariant = newGlyph._defaultGlyph;

        newGlyph.Set(mkfData.IDS.UNICODE, p_operation.unicode);
        glyphVariant.Set(mkfData.IDS.PATH_DATA, p_operation.path);

        p_operation.family.AddGlyph(newGlyph);

        p_operation.createdGlyph = newGlyph; // Store created glyph

    }

    _InternalUndo() {
        // if prevSvgString == null, release glyph, it was NULL before.
    }

    _InternalRedo() {

    }

}

module.exports = ActionCreateGlyph;