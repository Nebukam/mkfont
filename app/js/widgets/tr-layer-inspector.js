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

        { options: { propertyId: mkfData.IDS.CHARACTER_NAME }, css: 'small' },
        {
            cl: nkm.uilib.buttons.Tool, options: {
                icon: `search-small`, htitle: `Search in glyphs`, variant: ui.FLAGS.MINIMAL, size: ui.FLAGS.SIZE_S,
            }, css: 'btn'
        },

        { options: { propertyId: mkfData.IDS.INVERTED } },
        { options: { propertyId: mkfData.IDS.USE_PREV_LAYER } },
        { cl: ControlHeader, options: { label: `Context`, label2: `Layer` }, css: 'hdr' },
        { options: { propertyId: mkfData.IDS.TR_ANCHOR, inputOnly: true }, css: 'vsmall' },
        { options: { propertyId: mkfData.IDS.TR_LYR_BOUNDS_MODE, inputOnly: true }, css: 'small' },

        { options: { propertyId: mkfData.IDS.TR_LYR_SELF_ANCHOR, inputOnly: true }, css: 'vsmall' },
        { options: { propertyId: mkfData.IDS.TR_BOUNDS_MODE, inputOnly: true }, css: 'small' },

        { options: { propertyId: mkfData.IDS.TR_LYR_SCALE_MODE, inputOnly: true }, css: 'small' },
        { options: { propertyId: mkfData.IDS.TR_LYR_SCALE_FACTOR }, requireData: true, hideWhen: { fn: isMANUAL } },

        { cl: ControlHeader, options: { label: `Offsets` }, css: 'hdr', requireData: true },
        { options: { propertyId: mkfData.IDS.TR_X_OFFSET }, requireData: true },
        { options: { propertyId: mkfData.IDS.TR_Y_OFFSET }, requireData: true },        
                

    ];

    static __trControls = [
        { options: { propertyId: mkfData.IDS.TR_MIRROR, inputOnly: true }, css: 'full' },
        { options: { propertyId: mkfData.IDS.TR_ROTATION } },
        { options: { propertyId: mkfData.IDS.TR_SKEW_ROT_ORDER }, css: `full` },
        { options: { propertyId: mkfData.IDS.TR_ROTATION_ANCHOR, inputOnly: true }, css: `vsmall` },
        { options: { propertyId: mkfData.IDS.TR_ROTATION }, css: `large` },
        { options: { propertyId: mkfData.IDS.TR_SKEW_X } },
        { options: { propertyId: mkfData.IDS.TR_SKEW_Y } },
    ];

    _Init() {
        super._Init();

        this._builder.defaultControlClass = PropertyControl;
        this._builder.defaultCSS = `control`;

        this._trBuilder = new nkm.datacontrols.helpers.ControlBuilder(this);
        this._trBuilder.options = { cl: PropertyControl, css: `foldout-item` };
        this.forwardData.To(this._trBuilder);
        this.forwardContext.To(this._trBuilder);
        this.forwardEditor.To(this._trBuilder);

    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                //'@': ['fade-in'],
                'display': 'flex',
                'flex-flow': 'row wrap',
                //'min-height': '0',
                //'overflow': 'auto',
                //'padding': '10px',
                'align-content': 'flex-start',
                'align-items': `center`,
            },
            '.control': {
                'flex': '1 1 100%',
            },
            '.small': {
                'flex': '1 1 45%'
            },
            '.header': {
                'margin': '5px 2px 5px 2px'
            },
            '.small': { 'flex': '1 1 25%' },
            '.vsmall': { 'flex': '1 1 15%' },
            '.large': { 'flex': '1 1 75%' },
            '.btn': {
                'flex': '0 0 32px',
                'margin': '0 2px 5px 2px',
            },
            '.drawer': {
                'padding': `10px`,
                'flex': '1 1 100%',
                'background-color': `rgba(19, 19, 19, 0.25)`,
                'border-radius': '4px',
            }
        }, base._Style());
    }

    _Render() {

        super._Render();

        let foldout = this.Attach(nkm.uilib.widgets.Foldout, `control drawer foldout-item`, this._body);
        foldout.options = { title: `Advanced`, icon: `gear`, prefId: `lyr-advanced-tr`, expanded: false };
        this._trBuilder.host = foldout;
        this._trBuilder.Build(this.constructor.__trControls);

    }

}

module.exports = LayerTransformSettingsInspector;
ui.Register(`mkf-layer-transform-settings-inspector`, LayerTransformSettingsInspector);