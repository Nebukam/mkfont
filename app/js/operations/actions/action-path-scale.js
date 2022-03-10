'use strict'

// Set svg property of a given char in a given glyph
/*const nkm = require(`@nkmjs/core`);*/
const actions = nkm.actions;
const data = require(`../../data`);
const svgpath = require('svgpath');

class ActionPathScale extends actions.Action {
    constructor() { super(); }

    // Expected operation format : { glyphVariant:GlyphVariantDataBlock, x:Number [, y:Number] }

    _InternalDo(p_operation, p_merge = false) {

        let
            glyphVariant = p_operation.glyphVariant,
            x = p_operation.x,
            y = p_operation.y || p_operation.y;

        let path = glyphVariant.Get(data.IDS.PATH),
            transformedPath = svgpath(path)
                .scale(x, y)
                .toString();

        glyphVariant.Set(data.IDS.PATH, transformedPath);

    }

    _InternalUndo() {
            // scale by 1/x, 1/y
    }

    _InternalRedo() {

    }

}

module.exports = ActionPathScale;