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
        { options: { propertyId: mkfData.IDS.TR_BOUNDS_MODE, inputOnly: true }, css: 'full' },
        { cl: mkfWidgets.ControlHeader, options: { label: `Scaling` }, css: 'header' },
        { options: { propertyId: mkfData.IDS.TR_SCALE_MODE, inputOnly: true }, css: 'large' },
        { options: { propertyId: mkfData.IDS.TR_SCALE_FACTOR }, requireData: true, hideWhen: { fn: isMANUAL } },
        { options: { propertyId: mkfData.IDS.TR_NRM_FACTOR }, requireData: true, hideWhen: { fn: isNRM } },
        { cl: mkfWidgets.ControlHeader, options: { label: `Anchoring & Alignment` }, css: 'header' },
        { options: { propertyId: mkfData.IDS.TR_ANCHOR, inputOnly: true }, css: 'vsmall' },
        { options: { propertyId: mkfData.IDS.TR_VER_ALIGN, inputOnly: true }, css: 'small' },
        //{ cl: mkfWidgets.ControlHeader, options: { label: `Horizontal align` }, css: 'header' },
        { options: { propertyId: mkfData.IDS.TR_HOR_ALIGN, inputOnly: true }, css: 'small' },

        { cl: mkfWidgets.ControlHeader, options: { label: `Translate` }, css: 'header', requireData: true }, //, disableWhen: { fn: isXMIN }
        { options: { propertyId: mkfData.IDS.TR_WIDTH_SHIFT }, requireData: true, disableWhen: { fn: isRNRM } }, //
        { options: { propertyId: mkfData.IDS.TR_WIDTH_PUSH }, requireData: true, disableWhen: { fn: isRNRM } }, //
        { options: { propertyId: mkfData.IDS.TR_AUTO_WIDTH }, requireData: true, disableWhen: { fn: isRNRM } }, //
        { options: { propertyId: mkfData.IDS.TR_Y_OFFSET }, requireData: true }, //
    ];

    static __trControls = [
        { options: { propertyId: mkfData.IDS.TR_MIRROR, inputOnly: true }, css: 'small' },
        { options: { propertyId: mkfData.IDS.TR_SKEW_ROT_ORDER }, css: `full` },
        { options: { propertyId: mkfData.IDS.TR_ROTATION_ANCHOR, inputOnly: true }, css: `small` },
        { options: { propertyId: mkfData.IDS.TR_ROTATION }, css: `large` },
        { options: { propertyId: mkfData.IDS.TR_SKEW_X } },
        { options: { propertyId: mkfData.IDS.TR_SKEW_Y } },
    ];

    _Init() {
        super._Init();

        this._builder.options = { cl: mkfWidgets.PropertyControl, css: `control` };

        this._trBuilder = new nkm.datacontrols.helpers.ControlBuilder(this);
        this._trBuilder.options = { cl: mkfWidgets.PropertyControl, css: `foldout-item` };
        this.forwardData.To(this._trBuilder);
        this.forwardContext.To(this._trBuilder);
        this.forwardEditor.To(this._trBuilder);

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
            },
            '.small': { 'flex': '1 1 45%' },
            '.header': {
                'margin': '5px 2px 5px 2px'
            },
            '.small': { 'flex': '1 1 25%' },
            '.vsmall': { 'flex': '1 1 15%' },
            '.large': { 'flex': '1 1 80%' },
            '.drawer': {
                'padding': `10px`,
                'flex': '1 1 100%',
                'background-color': `rgba(19, 19, 19, 0.25)`,
                'border-radius': '4px',
                'order':`500`
            }
        }, base._Style());
    }

    _Render() {

        super._Render();

        this._advancedFoldout = this.Attach(nkm.uilib.widgets.Foldout, `control drawer foldout-item`, this._body);
        this._advancedFoldout.options = { title: `Advanced`, icon: `gear`, prefId: `advanced-tr`, expanded: false };
        this._trBuilder.host = this._advancedFoldout;
        this._trBuilder.Build(this.constructor.__trControls);

    }


}

module.exports = TransformSettingsInspector;
ui.Register(`mkf-transform-settings-inspector`, TransformSettingsInspector);