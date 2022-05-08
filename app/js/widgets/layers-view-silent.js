'use strict';

const nkm = require(`@nkmjs/core`);
const SIGNAL = require("../signal");
const u = nkm.u;
const ui = nkm.ui;

const mkfData = require(`../data`);

const LayersView = require(`./layers-view`);
const LayerControlSilent = require(`./layer-control-silent`);

const __nolayer = `nolayer`;
const __limitReached = `limit-reached`;

const base = LayersView;
class LayersViewSilent extends base {
    constructor() { super(); }

    static __layerControlClass = LayerControlSilent;

    static __controls = [
        { options: { propertyId: mkfData.IDS.SHOW_ALL_LAYERS, directSet: true }, requireData: true },
    ];

    _Render() {
        super._Render();
        this._toolbar.Clear();
    }

    _RefreshLayerOrder() {
        this._delayedReorder.Cancel();
        this._layerCtrls.forEach((ctrl, i) => {
            ctrl.style.setProperty(`order`, i);
        });

        if(this._layerCtrls.length >= mkfData.INFOS.LAYER_LIMIT){
            this._flags.Set(__limitReached, true);
            this._limitLabel.Set(`<i>Only the first ${mkfData.INFOS.LAYER_LIMIT} most used components are shown.</i>`);
            this._createBtn.disabled = true;
        }else{
            this._flags.Set(__limitReached, false);
            this._limitLabel.Set(null);
            this._createBtn.disabled = false;
        }
        
    }


}

module.exports = LayersViewSilent;
ui.Register(`mkf-layer-view-silent`, LayersViewSilent);