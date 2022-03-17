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

        newGlyph.Set(mkfData.IDS.UNICODE, p_operation.unicode.u);
        newGlyph.unicodeInfos = p_operation.unicode;

        glyphVariant.Set(mkfData.IDS.PATH_DATA, p_operation.path);
        glyphVariant.transformSettings.BatchSet(p_operation.family.selectedSubFamily.transformSettings);

        p_operation.family.AddGlyph(newGlyph);
        glyphVariant.transformSettings.UpdateTransform();

        p_operation.glyph = newGlyph; // Store created glyph

        newGlyph.CommitUpdate();

    }

    _InternalUndo() {
        let
            targetGlyph = this._operation.glyph,
            family = this._operation.family;

        family.RemoveGlyph(targetGlyph);
    }

    _InternalRedo() {
        let
            targetGlyph = this._operation.glyph,
            family = this._operation.family;

        family.AddGlyph(targetGlyph);
    }

}

module.exports = ActionCreateGlyph;