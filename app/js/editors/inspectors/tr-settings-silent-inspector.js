'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;

const TransformSettingsInspector = require(`./tr-settings-inspector`);

const base = TransformSettingsInspector;
class TransformSettingsSilentInspector extends base {
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

module.exports = TransformSettingsSilentInspector;
ui.Register(`mkf-transform-settings-silent-inspector`, TransformSettingsSilentInspector);