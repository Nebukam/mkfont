//TODO : Need to support insert index,
'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const mkfData = require(`../../data`);

class ActionLayerAdd extends actions.Action {
    constructor() { super(); }

    _InternalDo(p_operation, p_merge = false) {

        let
            newLayer = nkm.com.Rent(mkfData.GlyphLayer),
            glyphVariant = p_operation.target,
            index = p_operation.index || -1,
            layerValues = p_operation.layerValues || null;

        newLayer.expanded = `expanded` in p_operation ? p_operation.expanded : true;
        glyphVariant.AddLayer(newLayer);
        //glyphVariant.transformSettings.UpdateTransform();

        if (layerValues) { newLayer.BatchSet(layerValues, true); }

        p_operation.layer = newLayer; // Store created glyph
        p_operation.index = index;

        newLayer.CommitUpdate();

    }

    _UpdateDisplayInfos() {
        this.displayInfos = {
            icon: `component-new`,
            name: `Create component`,
            title: `Added new component`
        };
    }

    _InternalUndo() {
        let
            layer = this._operation.layer,
            glyphVariant = this._operation.target;

        glyphVariant.RemoveLayer(layer);
    }

    _InternalRedo() {
        let
            layer = this._operation.layer,
            glyphVariant = this._operation.target;

        //TODO : Index!

        glyphVariant.AddLayer(layer);
    }

}

module.exports = ActionLayerAdd;