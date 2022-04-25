'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const operations = require(`../../operations/index`);

const SIGNAL = require(`../../signal`);

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfOperations = require(`../../operations`);
const mkfCmds = mkfOperations.commands;

const GlyphVariantInspector = require(`./glyph-iitem`);

const base = nkm.datacontrols.InspectorView;
class FamilyMetricsInspector extends base {
    constructor() { super(); }

    static __controls = [
        //{ cl:mkfWidgets.ControlHeader, options:{ label:`Definition` } },
        //{ options:{ propertyId:mkfData.IDS.FONT_STYLE } },
        //{ options:{ propertyId:mkfData.IDS.WEIGHT_CLASS } },

        { cl: mkfWidgets.ControlHeader, options: { label: `Resolution` } },
        { options: { propertyId: mkfData.IDS.EM_UNITS, command: mkfCmds.SetEM } },
        { options: { propertyId: mkfData.IDS.EM_RESAMPLE } },

        { cl: mkfWidgets.ControlHeader, options: { label: `Metrics` } },
        { options: { propertyId: mkfData.IDS.BASELINE } },
        { options: { propertyId: mkfData.IDS.ASCENT, command: mkfCmds.SetAscent } },
        { options: { propertyId: mkfData.IDS.ASC_RESAMPLE } },
        { options: { propertyId: mkfData.IDS.DESCENT } },

        { cl: mkfWidgets.ControlHeader, options: { label: `Control metrics` } },
        { options: { propertyId: mkfData.IDS.X_HEIGHT } },
        { options: { propertyId: mkfData.IDS.CAP_HEIGHT } },
        { options: { propertyId: mkfData.IDS.HEIGHT } },
        { options: { propertyId: mkfData.IDS.WIDTH } },
        { options: { propertyId: mkfData.IDS.MONOSPACE } },
        //{ options:{ propertyId:mkfData.IDS.UNDERLINE_POSITION } },
        //{ options:{ propertyId:mkfData.IDS.UNDERLINE_THICKNESS } },
        //{ options:{ propertyId:mkfData.IDS.H_ORIGIN_X } },
        //{ options:{ propertyId:mkfData.IDS.H_ORIGIN_Y } },
        //{ options:{ propertyId:mkfData.IDS.V_ORIGIN_X } },
        //{ options:{ propertyId:mkfData.IDS.V_ORIGIN_Y } },
    ];

    static __trControls = [
        { cl: mkfWidgets.ControlHeader, options: { label: `Glyph boundaries` }, css: 'header' },
        { options: { propertyId: mkfData.IDS.TR_WIDTH_SHIFT } },
        { options: { propertyId: mkfData.IDS.TR_WIDTH_PUSH } },
        { options: { propertyId: mkfData.IDS.TR_Y_OFFSET } }, //
    ];

    _Init() {
        super._Init();

        //this._builder.preProcessDataFn = this._Bind(this._PreprocessControlData);
        //TODO ::: IDS.ASCENT => this._Bind(this._SetAscent)

        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;

        this._trBuilder = new nkm.datacontrols.helpers.ControlBuilder(this);
        this._trBuilder.defaultControlClass = mkfWidgets.PropertyControl;
        this._trBuilder.defaultCSS = `control`;
        this.forwardData.To(this._trBuilder, { dataMember: `transformSettings` })

    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                'min-width': '350px',
                'display': 'flex',
                'flex-flow': 'column nowrap',
            },
            '.body': {
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'flex': '1 1 auto',
                'min-height': '0',
                'overflow': 'auto',
                'padding': '10px',
            },
            '.control': {
                'flex': '0 1 auto',
                'margin-bottom': '5px'
            },
            '.pangram': {
                'flex': '1 1 auto',
            }
        }, base._Style());
    }

    _Render() {
        this._body = ui.dom.El(`div`, { class: `body` }, this._host);
        this._builder.host = this._body;
        super._Render();
        this._trBuilder.host = this._body;
        this._trBuilder.Build(this.constructor.__trControls);
    }

}

module.exports = FamilyMetricsInspector;