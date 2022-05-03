'use strict';

const nkm = require(`@nkmjs/core`);
const SIGNAL = require("../signal");
const u = nkm.u;
const ui = nkm.ui;

const LayersView = require(`./layers-view`);
const LayerControlSilent = require(`./layer-control-silent`);

const __nolayer = `nolayer`;

const base = LayersView;
class LayersViewSilent extends base {
    constructor() { super(); }

    static __layerControlClass = LayerControlSilent;

    _Render() {
        super._Render();
        this._toolbar.visible = false;
    }
    

}

module.exports = LayersViewSilent;
ui.Register(`mkf-layer-view-silent`, LayersViewSilent);