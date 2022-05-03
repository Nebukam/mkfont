//TODO : Store layer index in stack for Redo.//TODO : Need to support insert index,
'use strict'

// Set svg property of a given char in a given glyph
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const mkfData = require(`../../data`);

class ActionLayerRemove extends actions.Action {
    constructor() { super(); }

    static __deepCleanFn(p_action){
        p_action._operation.target.Release();
    }

    _InternalDo(p_operation, p_merge = false) {

        let
            layer = p_operation.target,
            glyphVariant = layer._variant,
            index = glyphVariant.layers.IndexOf(layer);

        p_operation.variant = glyphVariant;
        
        glyphVariant.RemoveLayer(layer);
        glyphVariant.CommitUpdate();

    }

    _UpdateDisplayInfos() {
        this.displayInfos = {
            icon: `remove`,
            name: `Remove layer`,
            title: `Remove layer`
        };
    }

    _InternalUndo() {
        let
            layer = this._operation.target,
            glyphVariant = this._operation.variant;

        //TODO : Index!

        glyphVariant.AddLayer(layer);
    }

    _InternalRedo() {
        let
            layer = this._operation.target,
            glyphVariant = this._operation.variant;

        glyphVariant.RemoveLayer(layer);
    }

}

module.exports = ActionLayerRemove;