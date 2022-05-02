'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const UNICODE = require(`../unicode`);
const mkfData = require(`../data`);

// Manages what is shown & selectable in the viewport.

const ControlHeader = require(`./control-header`);
const PropertyControl = require(`./property-control`);

const isMANUAL = (owner) => { return owner.data.Get(mkfData.IDS.TR_LYR_SCALE_MODE) == mkfData.ENUMS.SCALE_MANUAL; };
const isNRM = (owner) => { return owner.data.Get(mkfData.IDS.TR_LYR_SCALE_MODE) == mkfData.ENUMS.SCALE_NORMALIZE; };

const base = nkm.datacontrols.InspectorView;
class LayerTransformSettingsInspector extends base {
    constructor() { super(); }

    static __controls = [
        { cl: ControlHeader, options: { label: `Glyph name` }, css: 'hdr' },
        { options: { propertyId: mkfData.IDS.CHARACTER_NAME, subData: `_layer` } },
        { options: { propertyId: mkfData.IDS.INVERTED, subData: `_layer` } },
        { cl: ControlHeader, options: { label: `Boundaries & Scale` }, css: 'hdr' },
        { options: { propertyId: mkfData.IDS.TR_LYR_BOUNDS_MODE, inputOnly: true }, css: 'small' },
        { options: { propertyId: mkfData.IDS.TR_BOUNDS_MODE, inputOnly: true }, css: 'small' },
        { options: { propertyId: mkfData.IDS.TR_MIRROR, inputOnly: true }, css: 'small' },
        { options: { propertyId: mkfData.IDS.TR_LYR_SCALE_MODE, inputOnly: true }, css: 'small' },
        { options: { propertyId: mkfData.IDS.TR_SCALE_FACTOR }, requireData: true, hideWhen: { fn: isMANUAL } },
        { options: { propertyId: mkfData.IDS.TR_NRM_FACTOR }, requireData: true, hideWhen: { fn: isNRM } },

        { cl: ControlHeader, options: { label: `Vertical align + anchoring` }, css: 'hdr' },
        { options: { propertyId: mkfData.IDS.TR_LYR_VER_ALIGN, inputOnly: true }, css: 'small' },
        { options: { propertyId: mkfData.IDS.TR_VER_ALIGN_ANCHOR, inputOnly: true }, css: 'small' },
        { cl: ControlHeader, options: { label: `Horizontal align + anchoring` }, css: 'hdr' },
        { options: { propertyId: mkfData.IDS.TR_LYR_HOR_ALIGN, inputOnly: true }, css: 'small' },
        { options: { propertyId: mkfData.IDS.TR_HOR_ALIGN_ANCHOR, inputOnly: true }, css: 'small' },
        { cl: ControlHeader, options: { label: `Offsets` }, css: 'hdr', requireData: true },
        { options: { propertyId: mkfData.IDS.TR_X_OFFSET }, requireData: true },
        { options: { propertyId: mkfData.IDS.TR_Y_OFFSET }, requireData: true },
    ];

    _Init() {
        super._Init();

        this._builder.defaultControlClass = PropertyControl;
        this._builder.defaultCSS = `control`;

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

module.exports = LayerTransformSettingsInspector;
ui.Register(`mkf-layer-transform-settings-inspector`, LayerTransformSettingsInspector);