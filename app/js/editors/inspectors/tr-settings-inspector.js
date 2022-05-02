'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

// Manages what is shown & selectable in the viewport.

const isXMIN = (owner) => { return (owner.data.Get(mkfData.IDS.TR_HOR_ALIGN) == mkfData.ENUMS.HALIGN_XMIN); };// && owner.data.Get(mkfData.IDS.TR_SCALE_MODE) != mkfData.ENUMS.SCALE_NORMALIZE); };
const isMANUAL = (owner) => { return owner.data.Get(mkfData.IDS.TR_SCALE_MODE) == mkfData.ENUMS.SCALE_MANUAL; };
const isNRM = (owner) => { return owner.data.Get(mkfData.IDS.TR_SCALE_MODE) == mkfData.ENUMS.SCALE_NORMALIZE; };
const isRNRM = (owner) => { return owner.data.Get(mkfData.IDS.TR_SCALE_MODE) != mkfData.ENUMS.SCALE_NORMALIZE; };

const base = nkm.datacontrols.InspectorView;
class TransformSettingsInspector extends base {
    constructor() { super(); }

    static __controls = [
        { cl: mkfWidgets.ControlHeader, options: { label: `Boundaries` }, css: 'header' },
        { options: { propertyId: mkfData.IDS.TR_BOUNDS_MODE, inputOnly: true }, css: 'vsmall' },
        { cl: mkfWidgets.ControlHeader, options: { label: `Scaling` }, css: 'header' },
        { options: { propertyId: mkfData.IDS.TR_SCALE_MODE, inputOnly: true }, css: 'osmall' },
        { options: { propertyId: mkfData.IDS.TR_SCALE_FACTOR }, requireData: true, hideWhen: { fn: isMANUAL } },
        { options: { propertyId: mkfData.IDS.TR_NRM_FACTOR }, requireData: true, hideWhen: { fn: isNRM } },
        { cl: mkfWidgets.ControlHeader, options: { label: `Vertical align` }, css: 'header' },
        { options: { propertyId: mkfData.IDS.TR_VER_ALIGN, inputOnly: true }, css: 'small' },
        { options: { propertyId: mkfData.IDS.TR_VER_ALIGN_ANCHOR, inputOnly: true }, css: 'small' },
        { cl: mkfWidgets.ControlHeader, options: { label: `Horizontal align` }, css: 'header' },
        { options: { propertyId: mkfData.IDS.TR_HOR_ALIGN, inputOnly: true }, css: 'small' },
        { options: { propertyId: mkfData.IDS.TR_HOR_ALIGN_ANCHOR, inputOnly: true }, css: 'small' },
        { cl: mkfWidgets.ControlHeader, options: { label: `Offsets` }, css: 'header', requireData: true }, //, disableWhen: { fn: isXMIN }
        { options: { propertyId: mkfData.IDS.TR_WIDTH_SHIFT }, requireData: true, disableWhen: { fn: isRNRM } }, //
        { options: { propertyId: mkfData.IDS.TR_WIDTH_PUSH }, requireData: true, disableWhen: { fn: isRNRM } }, //
        { options: { propertyId: mkfData.IDS.TR_AUTO_WIDTH }, requireData: true, disableWhen: { fn: isRNRM } }, //
        { options: { propertyId: mkfData.IDS.TR_Y_OFFSET }, requireData: true }, //
    ];

    _Init() {
        super._Init();

        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;

        this._dataPreProcessor = (p_owner, p_data) => {
            if (nkm.u.isInstanceOf(p_data, mkfData.Glyph)) { return p_data.family.transformSettings; }
            if (nkm.u.isInstanceOf(p_data, mkfData.GlyphVariant)) { return p_data.glyph.family.transformSettings; }
            if (nkm.u.isInstanceOf(p_data, mkfData.Family)) { return p_data.transformSettings; }
            return p_data;
        };
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                '@': ['fade-in'],
                'display': 'flex',
                'flex-flow': 'row wrap',
                //'min-height': '0',
                //'overflow': 'auto',
                //'padding': '10px',
                'align-content': 'flex-start',
            },
            '.control': {
                'flex': '1 1 100%',
                'margin': '0 2px 5px 2px'
            },
            '.small': {
                'flex': '1 1 45%'
            },
            '.header': {
                'margin': '5px 2px 5px 2px'
            },
            '.vsmall': {
                'flex': '1 1 25%'
            },
            '.osmall': {
                'flex': '1 1 80%'
            }
        }, base._Style());
    }

    //#region Family properties

    //#endregion


}

module.exports = TransformSettingsInspector;
ui.Register(`mkf-transform-settings-inspector`, TransformSettingsInspector);