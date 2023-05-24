'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const operations = require(`../../operations/index`);

const MiniHeader = nkm.datacontrols.widgets.MiniHeader;
const ValueControl = nkm.datacontrols.widgets.ValueControl;

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

const SIGNAL = require(`../../signal`);
const UNICODE = require(`../../unicode`);

const TransformSettingsInspector = require(`./tr-settings-inspector`);

const base = ui.views.View;
class GlyphInspectorPlaceholder extends base {
    constructor() { super(); }

    static __controls = [
        //{ cl: MiniHeader, options: { label: `Export` } },
        //{ options: { propertyId: mkfData.IDS.DO_EXPORT } },
        //{ options: { propertyId: mkfData.IDS.GLYPH_NAME } },//, css:'separator' 
    ];

    _Init() {
        super._Init();
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                ...nkm.style.rules.pos.rel,
                ...nkm.style.rules.flex.column.nowrap,
                'padding': '10px',
                ...nkm.style.rules.item.fill,
            },
            '.variant': {
                ...nkm.style.rules.item.fixed,
                'margin-bottom': '3px'
            },
            '.identity': {
                'margin-bottom': '0',
            },
            '.body': {

            },
            '.settings': {
                ...nkm.style.rules.item.grow,
                'margin-bottom': '10px'
            },
            '.control': {
                'margin-bottom': '5px',
            },
            '.infos': {
                ...nkm.style.rules.absolute.center,
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