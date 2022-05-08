'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const mkfData = require(`../data`);
const mkfOperations = require(`../operations`);
const mkfCmds = mkfOperations.commands;

const LayerControl = require(`./layer-control`);
const LayerTransformSettingsSilent = require(`./tr-layer-inspector-silent`);

const isMANUAL = (owner) => { return owner.data.Get(mkfData.IDS.TR_LYR_SCALE_MODE) == mkfData.ENUMS.LYR_SCALE_MANUAL; };
const isNRM = (owner) => { return owner.data.Get(mkfData.IDS.TR_LYR_SCALE_MODE) == mkfData.ENUMS.LYR_SCALE_NORMALIZE; };

const __circular = `circular`;
const __false = `false`;

const base = LayerControl;
class LayerControlSilent extends base {
    constructor() { super(); }

    static __widgetExpandData = false;

    static __controls = [
        { cl: LayerTransformSettingsSilent, options: {} }
    ];

    _Render() {
        super._Render();
        //this._moveUpBtn.Release();
        //this._moveDownBtn.Release();
    }

    _ToggleVisibility(p_input, p_value) {
        this._data.Set(mkfData.IDS.DO_EXPORT, p_value);
    }

    _DeleteLayer() { this._data._variant.RemoveLayer(this._data); }

    _MoveLayerUp() { this.editor.cmdLayerUp.Execute(this._data.surveyedList); }

    _MoveLayerDown() { this.editor.cmdLayerDown.Execute(this._data.surveyedList); }

}

module.exports = LayerControlSilent;
ui.Register(`mkf-layer-control-silent`, LayerControlSilent);