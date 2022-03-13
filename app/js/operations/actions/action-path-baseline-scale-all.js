'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const data = require(`../../data`);

class ActionPathBaselineScaleAll extends actions.Action {
    constructor() { super(); }

    // Expected operation format : { subFamily:SubFamilyDataBlock, em:Number, scale:Boolean }

    _InternalDo(p_operation, p_merge = false) {


        var
            subFamily = p_operation.subFamily,
            scaleFactor = p_operation.scale,
            asc = subFamily.Get(data.IDS.ASCENT),
            offset = asc - (asc * scaleFactor);

        p_operation.prevAscent = currentEM;
        p_operation.scaleFactor = scaleFactor; // do 1/scaleFactor to revert

        SVGOPS.TransformAll(subFamily, (svg) => { return svg.scale(scaleFactor, scaleFactor).translate(0, offset); });

    }

    _InternalUndo() {

    }

    _InternalRedo() {

    }

}

module.exports = ActionPathBaselineScaleAll;