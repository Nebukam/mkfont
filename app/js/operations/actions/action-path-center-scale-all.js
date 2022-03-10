'use strict'

// Set svg property of a given char in a given glyph
/*const nkm = require(`@nkmjs/core`);*/
const actions = nkm.actions;
const data = require(`../../data`);

const SVG = require(`../svg-operations`);

class ActionPathCenterScaleAll extends actions.Action {
    constructor() { super(); }

    // Expected operation format : { subFamily:SubFamilyDataBlock, em:Number, scale:Boolean }

    _InternalDo(p_operation, p_merge = false) {


        var
            subFamily = p_operation.subFamily,
            scaleFactor = p_operation.scale,
            asc = subFamily.Get(data.IDS.ASCENT),
            offsety = asc - (asc * scaleFactor);

        p_operation.prevAscent = currentEM;
        p_operation.scaleFactor = scaleFactor; // do 1/scaleFactor to revert

        let arr = p_subFamily.family._glyphs.internalArray;
        for (let i = 0, n = arr.length; i < n; i++) {

            let
                g = arr[i].GetVariant(p_subFamily),
                w = g.Resolve(data.IDS.WIDTH),
                offsetx = w - (w * scaleFactor),
                d = svgpath(g.Get(data.IDS.PATH))
                    .scale(scaleFactor, scaleFactor)
                    .translate(offsetx, offsety)
                    .toString();

            g.Set(IDS.PATH, d);

        }

    }

    _InternalUndo() {

    }

    _InternalRedo() {

    }

}

module.exports = ActionPathCenterScaleAll;