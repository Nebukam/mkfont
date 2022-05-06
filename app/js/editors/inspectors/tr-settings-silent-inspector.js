'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;

const TransformSettingsInspector = require(`./tr-settings-inspector`);

const base = TransformSettingsInspector;
class TransformSettingsSilentInspector extends base {
    constructor() { super(); }

    static __controls = [...base.__controls];
    static __trControls = [...base.__trControls];

    static {
        this.__DirectSet(this.__controls);
        this.__DirectSet(this.__trControls);
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

module.exports = TransformSettingsSilentInspector;
ui.Register(`mkf-transform-settings-silent-inspector`, TransformSettingsSilentInspector);