'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const data = require(`../../data`);
const svgpath = require('svgpath');

class ActionSetAscent extends actions.Action {
    constructor() { super(); }

    // Expected operation format : { subFamily:SubFamilyDataBlock, ascent:Number }

    _InternalDo(p_operation, p_merge = false) {


        let
            subFamily = p_operation.subFamily,
            glyphs = subFamily.family._glyphs,
            ascent = p_operation.ascent,
            currentAscent = subFamily.Get(data.IDS.ASCENT),
            offset = ascent - currentAscent;

        p_operation.prevAscent = currentAscent;
        
        // Update subFamily first so display values will be computed prior to glyph update
        subFamily.Set(data.IDS.ASCENT, ascent);

        for (let i = 0, n = glyphs.count; i < n; i++) {
            let
                glyphVariant = glyphs.At(i).GetVariant(subFamily),
                path = glyphVariant.Get(data.IDS.PATH),
                transformedPath = svgpath(path)
                    .translate(0, offset)
                    .toString();

            glyphVariant.Set(data.IDS.PATH, transformedPath);

        }


    }

    _InternalUndo() {

    }

    _InternalRedo() {

    }

}

module.exports = ActionSetAscent;