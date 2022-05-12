'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const SHARED_OPS = require(`./shared-ops`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdLayersPaste extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._Bind(this._PasteTransforms);
        this._Bind(this._ReplaceLayers);
        this._Bind(this._AddLayers);
    }

    _InternalExecute() {



        let
            callback = null,
            groupInfos = null;

        if (nkm.ui.INPUT.alt) {

            groupInfos = {
                icon: `clipboard-read`,
                name: `Copy comp. transforms`,
                title: `Replaced layers`
            };

            callback = this._PasteTransforms;

        } else if (!nkm.ui.INPUT.shift) {

            groupInfos = {
                icon: `clipboard-read`,
                name: `Replace components`,
                title: `Replaced components`
            };

            callback = this._ReplaceLayers;

        } else {

            groupInfos = {
                icon: `clipboard-read`,
                name: `Paste components`,
                title: `Pasted components`
            };

            callback = this.AddLayers;

        }

        this._emitter.StartActionGroup(groupInfos);

        let success = SHARED_OPS.PasteTo(this._emitter, SHARED_OPS.MODE_CUSTOM, callback);

        this._emitter.EndActionGroup();

        return success ? this._Success() : this._Fail();

    }

    _PasteTransforms(p_editor, p_sourceGlyph, p_unicodeInfos, p_scaleFactor) {
        let targetGlyph = p_editor.data.GetGlyph(p_unicodeInfos.u);
        if (targetGlyph.isNull || targetGlyph == p_sourceGlyph) { return; }
        SHARED_OPS.PasteLayersTransforms(p_editor, targetGlyph.activeVariant, p_sourceGlyph.activeVariant, p_scaleFactor, false);
    }

    _ReplaceLayers(p_editor, p_sourceGlyph, p_unicodeInfos, p_scaleFactor) {
        let targetGlyph = p_editor.data.GetGlyph(p_unicodeInfos.u);
        if (targetGlyph.isNull || targetGlyph == p_sourceGlyph) { return; }
        SHARED_OPS.RemoveLayers(p_editor, targetGlyph.activeVariant);
        SHARED_OPS.AddLayers(p_editor, targetGlyph.activeVariant, p_sourceGlyph.activeVariant, p_scaleFactor, false);
    }

    _AddLayers(p_editor, p_sourceGlyph, p_unicodeInfos, p_scaleFactor) {
        let targetGlyph = p_editor.data.GetGlyph(p_unicodeInfos.u);
        if (targetGlyph.isNull || targetGlyph == p_sourceGlyph) { return; }
        SHARED_OPS.AddLayers(p_editor, targetGlyph.activeVariant, p_sourceGlyph.activeVariant, p_scaleFactor, false);
    }

}

module.exports = CmdLayersPaste;