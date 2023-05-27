'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;

const MiniHeader = nkm.datacontrols.widgets.MiniHeader;

const mkfData = require(`../../data`);
const mkfOperations = require(`../../operations`);
const mkfCmds = mkfOperations.commands;

const LOC = require(`../../locales`);

const base = nkm.uilib.inspectors.ValueList;
class FamilyMetricsInspector extends base {
    constructor() { super(); }

    static __controls = [
        //{ cl:MiniHeader, options:{ label:`Definition` } },
        //{ options:{ propertyId:mkfData.IDS.FONT_STYLE } },
        //{ options:{ propertyId:mkfData.IDS.WEIGHT_CLASS } },

        { cl: MiniHeader, options: { label: `Resolution` } },
        { options: { propertyId: mkfData.IDS.EM_UNITS, command: mkfCmds.SetEM } },
        { options: { propertyId: mkfData.IDS.EM_RESAMPLE, invertInputOrder: true } },

        { cl: MiniHeader, options: { label: `Metrics` } },
        { options: { propertyId: mkfData.IDS.BASELINE } },
        { options: { propertyId: mkfData.IDS.ASCENT, command: mkfCmds.SetAscent } },
        { options: { propertyId: mkfData.IDS.ASC_RESAMPLE, invertInputOrder: true } },
        { options: { propertyId: mkfData.IDS.DESCENT } },

        { cl: MiniHeader, options: { label: `Control metrics` } },
        { options: { propertyId: mkfData.IDS.X_HEIGHT } },
        { options: { propertyId: mkfData.IDS.CAP_HEIGHT } },
        { options: { propertyId: mkfData.IDS.HEIGHT } },
        { options: { propertyId: mkfData.IDS.WIDTH } },
        { options: { propertyId: mkfData.IDS.MONOSPACE, invertInputOrder: true } },
        //{ options:{ propertyId:mkfData.IDS.UNDERLINE_POSITION } },
        //{ options:{ propertyId:mkfData.IDS.UNDERLINE_THICKNESS } },
        //{ options:{ propertyId:mkfData.IDS.H_ORIGIN_X } },
        //{ options:{ propertyId:mkfData.IDS.H_ORIGIN_Y } },
        //{ options:{ propertyId:mkfData.IDS.V_ORIGIN_X } },
        //{ options:{ propertyId:mkfData.IDS.V_ORIGIN_Y } },
    ];

    static __trControls = [
        { cl: MiniHeader, options: { label: `Translations` } },
        { options: { propertyId: mkfData.IDS.TR_WIDTH_SHIFT } },
        { options: { propertyId: mkfData.IDS.TR_WIDTH_PUSH } },
        { options: { propertyId: mkfData.IDS.TR_Y_OFFSET } }, //

        { cl: MiniHeader, options: { label: `Rotation & skews` } },
        { options: { propertyId: mkfData.IDS.TR_SKEW_ROT_ORDER } },
        { options: { propertyId: mkfData.IDS.TR_ROTATION_ANCHOR, inputOnly: true }, css: `small` }, //
        { options: { propertyId: mkfData.IDS.TR_ROTATION }, css: `large` },
        { options: { propertyId: mkfData.IDS.TR_SKEW_X } }, //
        { options: { propertyId: mkfData.IDS.TR_SKEW_Y } }, //
    ];

    static __width = `350px`;

    _Render() {

        super._Render();

        nkm.uilib.views.Foldout(this, {
            title: LOC.labelTrDefaults,
            icon: `gear`,
            prefId: `f-metrics-tr`,
            expanded: true,
            controls: this.constructor.__trControls,
            forwardData: { get: `_transformSettings` }
        });

    }

}

module.exports = FamilyMetricsInspector;