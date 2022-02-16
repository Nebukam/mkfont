'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const data = require(`../../data`);

class ActionSetSVG extends actions.Action {
    constructor() { super(); }

    // Expected operation format : { font:FontDataBlock, targetSlot:SlotCatalogItem, svg:svg }

    _InternalDo(p_operation, p_merge = false) {

        let
            slotData = p_operation.targetSlot,
            glyphData = slotData.GetOption(`data`, null),
            svg = p_operation.svg;

        if (!glyphData) { return; }

        if(glyphData == data.Glyph.NULL ){
            
            glyphData = nkm.com.Rent(data.Glyph);
            glyphData.unicode = p_operation.unicode ? p_operation.unicode : slotData._options.glyph;

            //TODO: Grab unicode data etc from slot       
            slotData.data = glyphData;

            let fontData = p_operation.font;
            fontData.AddGlyph(glyphData);

        }else{
            p_operation.prevSvg = glyphData.svg;
        }

        glyphData.svg = svg;

    }

    _InternalUndo() {
        // if prevSvgString == null, release glyph, it was NULL before.
    }

    _InternalRedo() {

    }

}

module.exports = ActionSetSVG;