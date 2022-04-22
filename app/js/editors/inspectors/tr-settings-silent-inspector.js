const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

const TransformSettingsInspector = require(`./tr-settings-inspector`);

const base = TransformSettingsInspector;
class TransformSettingsSilentInspector extends base {
    constructor() { super(); }

    static __controls = [...base.__controls];

    _Init() {
        super._Init();

        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;

        for (let i = 0; i < base.__controls.length; i++) {
            let config = base.__controls[i];
            if (config.options) {
                config.options.command = null;
                config.options.onSubmit = null;
            }
        }

    }


}

module.exports = TransformSettingsSilentInspector;
ui.Register(`mkf-transform-settings-silent-inspector`, TransformSettingsSilentInspector);