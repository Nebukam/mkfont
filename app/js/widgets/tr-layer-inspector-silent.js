'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;

const LayerTransformSettingsInspector = require(`./tr-layer-inspector`);

const base = LayerTransformSettingsInspector;
class LayerTransformSettingsInspectorSilent extends base {
    constructor() { super(); }

    static __controls = [...base.__controls];

    static {
        for (let i = 0; i < this.__controls.length; i++) {
            let config = { ...this.__controls[i] };
            if (config.options) { config.options = { ...config.options, directSet: true}; }
            else { config.options = { directSet: true }; }
        }
    }

}

module.exports = LayerTransformSettingsInspectorSilent;
ui.Register(`mkf-layer-transform-settings-inspector-silent`, LayerTransformSettingsInspectorSilent);