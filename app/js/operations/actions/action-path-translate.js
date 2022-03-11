'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const data = require(`../../data`);
const svgpath = require('svgpath');

class ActionPathTranslate extends actions.Action {
    constructor() { super(); }

    // Expected operation format : { glyphVariant:GlyphVariantDataBlock, x:Number, y:Number }

    _InternalDo(p_operation, p_merge = false) {

        let
            glyphVariant = p_operation.glyphVariant,
            x = p_operation.trX || 0,
            y = p_operation.trY || 0;

        let path = glyphVariant.Get(data.IDS.PATH),
            transformedPath = svgpath(path)
                .translate(x, y)
                .toString();

        glyphVariant.Set(data.IDS.PATH, transformedPath);

    }

    _InternalUndo() {

    }

    _InternalRedo() {

    }

}

module.exports = ActionPathTranslate;