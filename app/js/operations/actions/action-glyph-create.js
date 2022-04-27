'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const mkfData = require(`../../data`);

class ActionCreateGlyph extends actions.Action {
    constructor() { super(); }

    // Expected operation format : { family:FamilyDataBlock, unicode:`abc`, path:pathData, transforms:{} }

    _InternalDo(p_operation, p_merge = false) {

        let
            newGlyph = nkm.com.Rent(mkfData.Glyph),
            glyphVariant = newGlyph._defaultGlyph,
            family = p_operation.family,
            variantValues = p_operation.variantValues || null,
            glyphValues = p_operation.glyphValues || null,
            path = p_operation.path || null,
            defaultTr = family.transformSettings,
            transforms = p_operation.transforms || {};

        newGlyph.family = family; // Otherwise Resolve() fails

        newGlyph.Set(mkfData.IDS.UNICODE, p_operation.unicode.u);
        newGlyph.unicodeInfos = p_operation.unicode;

        if (glyphValues) { newGlyph.BatchSet(glyphValues); }

        if (variantValues) { glyphVariant.BatchSet(variantValues); }
        if (path) { glyphVariant.Set(mkfData.IDS.PATH_DATA, path); }

        glyphVariant.transformSettings.BatchSet(defaultTr);
        glyphVariant.transformSettings.BatchSet(transforms);
        glyphVariant.BatchSet(transforms);

        family.AddGlyph(newGlyph);
        glyphVariant.transformSettings.UpdateTransform();

        p_operation.glyph = newGlyph; // Store created glyph

        newGlyph.CommitUpdate();

    }

    _UpdateDisplayInfos() {
        this.displayInfos = {
            icon: `new`,
            name: `Create : ${this._operation.glyph.unicodeInfos.char}`,
            title: `Create glyph : ${this._operation.glyph.unicodeInfos.char}`
        };
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