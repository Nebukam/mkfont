'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);

class ActionSetLayerIndex extends nkm.data.ops.actions.SetPropertyValue {
    constructor() { super(); }

    _UpdateValue(p_target, p_new, p_old) {
        p_target._variant.MoveLayer(p_target, p_new);
    }

}

module.exports = ActionSetLayerIndex;