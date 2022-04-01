'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const mkfData = require(`../../data`);

class ActionCreateGlyph extends actions.Action {
    constructor() { super(); }

    // Expected operation format : { family:FamilyDataBlock, unicode:`abc`, path:pathData, transforms:{} }

    get title(){ return `Create glyph : ${this._operation.glyph.unicodeInfos.char}`; }

    _InternalDo(p_operation, p_merge = false) {

        let
            newGlyph = nkm.com.Rent(mkfData.Glyph),
            glyphVariant = newGlyph._defaultGlyph,
            family = p_operation.family,
            defaultTr = family.selectedSubFamily.transformSettings,
            transforms = p_operation.transforms || {};

        newGlyph.Set(mkfData.IDS.UNICODE, p_operation.unicode.u);
        newGlyph.unicodeInfos = p_operation.unicode;

        glyphVariant.Set(mkfData.IDS.PATH_DATA, p_operation.path);
        glyphVariant.transformSettings.BatchSet(defaultTr);
        glyphVariant.transformSettings.BatchSet(transforms);

        family.AddGlyph(newGlyph);
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