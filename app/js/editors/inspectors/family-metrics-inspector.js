'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;

const MiniHeader = nkm.datacontrols.widgets.MiniHeader;
const ValueControl = nkm.datacontrols.widgets.ValueControl;

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfOperations = require(`../../operations`);
const mkfCmds = mkfOperations.commands;

const LOC = require(`../../locales`);

const base = nkm.datacontrols.InspectorView;
class FamilyMetricsInspector extends base {
    constructor() { super(); }

    static __controls = [
        //{ cl:MiniHeader, options:{ label:`Definition` } },
        //{ options:{ propertyId:mkfData.IDS.FONT_STYLE } },
        //{ options:{ propertyId:mkfData.IDS.WEIGHT_CLASS } },

        { cl: MiniHeader, options: { label: `Resolution` } },
        { options: { propertyId: mkfData.IDS.EM_UNITS, command: mkfCmds.SetEM } },
        { options: { propertyId: mkfData.IDS.EM_RESAMPLE, invertInputOrder:true } },

        { cl: MiniHeader, options: { label: `Metrics` } },
        { options: { propertyId: mkfData.IDS.BASELINE } },
        { options: { propertyId: mkfData.IDS.ASCENT, command: mkfCmds.SetAscent } },
        { options: { propertyId: mkfData.IDS.ASC_RESAMPLE, invertInputOrder:true } },
        { options: { propertyId: mkfData.IDS.DESCENT } },

        { cl: MiniHeader, options: { label: `Control metrics` } },
        { options: { propertyId: mkfData.IDS.X_HEIGHT } },
        { options: { propertyId: mkfData.IDS.CAP_HEIGHT } },
        { options: { propertyId: mkfData.IDS.HEIGHT } },
        { options: { propertyId: mkfData.IDS.WIDTH } },
        { options: { propertyId: mkfData.IDS.MONOSPACE, invertInputOrder:true } },
        //{ options:{ propertyId:mkfData.IDS.UNDERLINE_POSITION } },
        //{ options:{ propertyId:mkfData.IDS.UNDERLINE_THICKNESS } },
        //{ options:{ propertyId:mkfData.IDS.H_ORIGIN_X } },
        //{ options:{ propertyId:mkfData.IDS.H_ORIGIN_Y } },
        //{ options:{ propertyId:mkfData.IDS.V_ORIGIN_X } },
        //{ options:{ propertyId:mkfData.IDS.V_ORIGIN_Y } },
    ];

    static __trControls = [        
        { cl: MiniHeader, options: { label: `Translations` }, css: 'full' },
        { options: { propertyId: mkfData.IDS.TR_WIDTH_SHIFT }, css: 'full'  },
        { options: { propertyId: mkfData.IDS.TR_WIDTH_PUSH }, css: 'full'  },
        { options: { propertyId: mkfData.IDS.TR_Y_OFFSET }, css: 'full'  }, //
        
        { cl: MiniHeader, options: { label: `Rotation & skews` }, css: 'full' },
        { options: { propertyId: mkfData.IDS.TR_SKEW_ROT_ORDER }, css: 'full' },
        { options: { propertyId: mkfData.IDS.TR_ROTATION_ANCHOR, inputOnly:true }, css:`small` }, //
        { options: { propertyId: mkfData.IDS.TR_ROTATION }, css:`large` },
        { options: { propertyId: mkfData.IDS.TR_SKEW_X }, css: 'full' }, //
        { options: { propertyId: mkfData.IDS.TR_SKEW_Y } }, //
    ];

    _Init() {
        super._Init();

        this._builder.options = { cl: ValueControl, css: `control` };

        this._trBuilder = new nkm.datacontrols.helpers.ControlBuilder(this);
        this._trBuilder.options = { cl: ValueControl, css: `foldout-item` };
        this.forwardData.To(this._trBuilder, { get: `_transformSettings` });
        this.forwardContext.To(this._trBuilder);
        this.forwardEditor.To(this._trBuilder);

    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                'width': '350px',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'overflow':`auto`
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
                'flex': '0 0 auto',
                'margin': '0',
                'margin-bottom': '5px'
            },
            '.drawer': {
                'padding': `10px`,
                'flex': '1 1 100%',
                'background-color': `rgba(19, 19, 19, 0.25)`,
                'border-radius': '4px',
                'margin-bottom': '0'
            }
        }, base._Style());
    }

    _Render() {
        this._body = ui.dom.El(`div`, { class: `body` }, this._host);
        this._builder.host = this._body;
        super._Render();

        let foldout = this.Attach(nkm.uilib.widgets.Foldout, `control drawer`, this._body);
        foldout.options = { title: LOC.labelTrDefaults, icon: `gear`, prefId: `f-metrics-tr`, expanded: true };
        this._trBuilder.host = foldout;
        this._trBuilder.Build(this.constructor.__trControls);
    }

}

module.exports = FamilyMetricsInspector;