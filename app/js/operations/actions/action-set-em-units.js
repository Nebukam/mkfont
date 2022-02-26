'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const data = require(`../../data`);
const svgpath = require('svgpath');

const SVG = require(`../svg-operations`);

const scaleList = [
    data.IDS.ASCENT,
    data.IDS.DESCENT,
    data.IDS.WIDTH,
    data.IDS.HEIGHT,
];

class ActionSetEM extends actions.Action {
    constructor() { super(); }

    // Expected operation format : { subFamily:SubFamilyDataBlock, em:Number, scale:Boolean }

    _InternalDo(p_operation, p_merge = false) {


        var
            subFamily = p_operation.subFamily,
            newEM = p_operation.em,
            resample = p_operation.resample,
            oldEM = subFamily.Get(data.IDS.EM_UNITS),
            scaleFactor = newEM / oldEM;

        p_operation.prevAscent = oldEM;
        p_operation.scaleFactor = scaleFactor; // do 1/scaleFactor to revert

        if (resample) {
            let scaledValues = { [data.IDS.EM_UNITS]: newEM };
            for (let s = 0; s < scaleList.length; s++) {
                let id = scaleList[s];
                scaledValues[id] = subFamily.Get(id) * scaleFactor;
            }

            subFamily.BatchSet(scaledValues);

            //SVG.TransformAll(subFamily, (svg) => { return svg.scale(scaleFactor, scaleFactor); });
            let arr = subFamily.family._glyphs.internalArray;
            for (let i = 0, n = arr.length; i < n; i++) {

                let
                    g = arr[i].GetVariant(subFamily),
                    w = g.Get(data.IDS.WIDTH),
                    h = g.Get(data.IDS.HEIGHT),
                    d = svgpath(g.Get(data.IDS.PATH))
                        .scale(scaleFactor, scaleFactor)
                        .toString(),
                    gValues = { [data.IDS.PATH]: d };

                if (w != null) { gValues[data.IDS.WIDTH] = w * scaleFactor; }
                if (h != null) { gValues[data.IDS.HEIGHT] = h * scaleFactor; }

                g.BatchSet(gValues);

            }

        } else {
            subFamily.Set(data.IDS.EM_UNITS, newEM);
        }

    }

    _InternalUndo() {

    }

    _InternalRedo() {

    }

}

module.exports = ActionSetEM;