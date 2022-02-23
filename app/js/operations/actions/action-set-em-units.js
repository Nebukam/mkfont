'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const data = require(`../../data`);
const svgpath = require('svgpath');

const scaleList = [
    data.IDS.ASCENT,
    data.IDS.DESCENT,
    data.IDS.WIDTH,
    data.IDS.HEIGHT,
];

class ActionSetAscent extends actions.Action {
    constructor() { super(); }

    // Expected operation format : { subFamily:SubFamilyDataBlock, em:Number, scale:Boolean }

    _InternalDo(p_operation, p_merge = false) {


        let
            subFamily = p_operation.subFamily,
            glyphs = subFamily.family._glyphs,
            em = p_operation.em,
            currentEM = subFamily.Get(data.IDS.ASCENT),
            scaleFactor = em / currentEM;

        p_operation.prevAscent = currentEM;
        p_operation.scaleFactor = scaleFactor; // do 1/scaleFactor to revert

        // scale all relevant font metrics
        for (let s = 0; s < scaleList.length; s++) {

        }

        for (let i = 0, n = glyphs.count; i < n; i++) {

            let
                glyphVariant = glyphs.At(i).GetVariant(subFamily),
                path = glyphVariant.Get(data.IDS.PATH),
                transformedPath = svgpath(path)
                    .scale(scaleFactor, scaleFactor)
                    .toString();

            // scale all relevant glyph metrics
            for (let s = 0; s < scaleList.length; s++) {

            }

            glyphVariant.Set(data.IDS.PATH, transformedPath); // use BatchSet instead

        }


    }

    _InternalUndo() {

    }

    _InternalRedo() {

    }

}

module.exports = ActionSetAscent;