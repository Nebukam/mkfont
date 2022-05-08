'use strict';

const nkm = require(`@nkmjs/core`);
const SIGNAL = require("../signal");
const u = nkm.u;
const ui = nkm.ui;

const mkfData = require(`../data`);

const LayersView = require(`./layers-view`);
const LayerControlSilent = require(`./layer-control-silent`);

const __nolayer = `nolayer`;

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
        this._flags.Set(__nolayer, this._layerCtrls.length <= 0);
    }


}

module.exports = LayersViewSilent;
ui.Register(`mkf-layer-view-silent`, LayersViewSilent);