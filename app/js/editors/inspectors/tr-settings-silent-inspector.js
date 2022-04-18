const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

const TransformSettingsInspector = require(`./tr-settings-inspector`);

class TransformSettingsSilentInspector extends TransformSettingsInspector {
    constructor() { super(); }

    static __controls = [...TransformSettingsInspector.__controls];

    _Init() {
        super._Init();

        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;

        for (let i = 0; i < TransformSettingsInspector.__controls.length; i++) {
            let config = TransformSettingsInspector.__controls[i];
            if (config.options) {
                config.options.command = null;
                config.options.onSubmit = null;
            }
        }

    }


}

module.exports = TransformSettingsSilentInspector;
ui.Register(`mkf-transform-settings-silent-inspector`, TransformSettingsSilentInspector);