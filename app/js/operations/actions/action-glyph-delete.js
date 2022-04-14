'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const mkfData = require(`../../data`);

class ActionGlyphDelete extends actions.Action {
    constructor() { super(); }

    static __deepCleanFn(p_action){
        p_action._operation.glyph.Release();
    }

    // Expected operation format : { family:FamilyDataBlock, glyph:GlyphDataBlock, path:pathData }

    _InternalDo(p_operation, p_merge = false) {

        let
            targetGlyph = p_operation.glyph,
            family = p_operation.family;

        family.RemoveGlyph(targetGlyph);

    }

    _UpdateDisplayInfos(){
        this.displayInfos = {
            icon:`remove`,
            name:`Delete: ${this._operation.glyph.unicodeInfos.char}`,
            title:`Delete glyph : ${this._operation.glyph.unicodeInfos.char}`
        };
    }

    _InternalUndo() {

        let
            targetGlyph = this._operation.glyph,
            family = this._operation.family;

        family.AddGlyph(targetGlyph);

    }

    _InternalRedo() {

        let
            targetGlyph = this._operation.glyph,
            family = this._operation.family;

        family.RemoveGlyph(targetGlyph);

    }

}

module.exports = ActionGlyphDelete;