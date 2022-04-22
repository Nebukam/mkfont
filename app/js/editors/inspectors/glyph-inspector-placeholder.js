'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const operations = require(`../../operations/index`);

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

const SIGNAL = require(`../../signal`);
const UNICODE = require(`../../unicode`);

const TransformSettingsInspector = require(`./tr-settings-inspector`);

const base = ui.views.View;
class GlyphInspectorPlaceholder extends base {
    constructor() { super(); }

    static __controls = [
        //{ cl: mkfWidgets.ControlHeader, options: { label: `Export` } },
        //{ options: { propertyId: mkfData.IDS.EXPORT_GLYPH } },
        //{ options: { propertyId: mkfData.IDS.GLYPH_NAME } },//, css:'separator' 
    ];

    _Init() {
        super._Init();
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                'padding': '10px',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'position': 'relative',
                'flex':`1 1 auto`,
            },
            '.variant': {
                'flex': '0 0 auto',
                'margin-bottom': '3px'
            },
            '.identity': {
                'margin-bottom': '0',
            },
            '.body': {

            },
            '.settings': {
                'flex': '1 0 auto',
                'margin-bottom': '10px'
            },
            '.control': {
                'margin-bottom': '5px',
            },
            '.infos': {
                '@': [`absolute-center`],
                'text-align':'center',
                'opacity':'0.5'
            }
        }, base._Style());
    }

    _Render() {
        super._Render();
        this._tempLabel = new ui.manipulators.Text(ui.El(`div`, { class: `infos label` }, this._host));
        this._tempLabel.Set(`<i>Select one or multiple glyphs to edit them here.</i>`);
    }

}

module.exports = GlyphInspectorPlaceholder;