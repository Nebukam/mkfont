'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;

const LayerTransformSettingsInspector = require(`./tr-layer-inspector`);

const base = LayerTransformSettingsInspector;
class LayerTransformSettingsInspectorSilent extends base {
    constructor() { super(); }

    static __controls = [...base.__controls];
    static __trControls = [...base.__trControls];
    static __exControls = [...base.__exControls];

    static {
        this.__DirectSet(this.__controls);
        this.__DirectSet(this.__trControls);
        this.__DirectSet(this.__exControls);
    }

    static __DirectSet(p_array) {
        for (let i = 0; i < p_array.length; i++) {
            let config = { ...p_array[i] };
            if (config.options) { config.options = { ...config.options, directSet: true }; }
            else { config.options = { directSet: true }; }
            p_array[i] = config;
        }
    }

}

module.exports = LayerTransformSettingsInspectorSilent;
ui.Register(`mkf-layer-transform-settings-inspector-silent`, LayerTransformSettingsInspectorSilent);