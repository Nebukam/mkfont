'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;

const mkfOperations = require(`../operations`);
const mkfCmds = mkfOperations.commands;
const mkfData = require(`../data`);
const LOC = require(`../locales`);

// Manages what is shown & selectable in the viewport.

const MiniHeader = nkm.datacontrols.widgets.MiniHeader;

const isMANUAL = (owner) => { return owner.data.Get(mkfData.IDS.TR_LYR_SCALE_MODE) == mkfData.ENUMS.SCALE_MANUAL; };
const isNRM = (owner) => { return owner.data.Get(mkfData.IDS.TR_LYR_SCALE_MODE) == mkfData.ENUMS.SCALE_NORMALIZE; };

const base = nkm.datacontrols.InspectorView;
class LayerTransformSettingsInspector extends base {
    constructor() { super(); }

    static __controls = [
        
        { options: { propertyId: mkfData.IDS.LYR_CHARACTER_NAME }, css: 'small' },
        {
            cl: nkm.uilib.buttons.Tool, options: {
                icon: `search-small`, htitle: `Glyph picker`, variant: ui.FLAGS.FRAME, size: ui.FLAGS.SIZE_S,
                trigger: {
                    fn: (p_self) => {
                        let layerView = ui.FindFirstParent(p_self, `mkf-layer-view`) || ui.FindFirstParent(p_self, `mkf-layer-view-silent`);
                        if (!layerView) { return; }
                        layerView._OpenPicker(p_self.parent);
                    }, arg: ui.FLAGS.SELF
                }
            }, css: 'btn'
        },
        
        { cl: MiniHeader, options: { label: `Context`, label2: `Layer` }, css: 'hdr' },
        { options: { propertyId: mkfData.IDS.TR_ANCHOR, inputOnly: true }, css: 'vvsmall' },
        { options: { propertyId: mkfData.IDS.TR_LYR_BOUNDS_MODE, inputOnly: true }, css: 'small' },

        { options: { propertyId: mkfData.IDS.TR_LYR_SELF_ANCHOR, inputOnly: true }, css: 'vvsmall' },
        { options: { propertyId: mkfData.IDS.TR_BOUNDS_MODE, inputOnly: true }, css: 'small' },

        //{ options: { propertyId: mkfData.IDS.TR_LYR_SCALE_MODE, inputOnly: true }, css: 'small' },
        { options: { propertyId: mkfData.IDS.TR_LYR_SCALE_FACTOR }, css: 'full', requireData: true }, //, hideWhen: { fn: isMANUAL }
        { cl: MiniHeader, options: { label: LOC.labelOffsets }, css: 'hdr', requireData: true },
        { options: { propertyId: mkfData.IDS.TR_X_OFFSET }, requireData: true },
        { options: { propertyId: mkfData.IDS.TR_Y_OFFSET }, requireData: true },


    ];

    static __trControls = [
        { cl: MiniHeader, options: { label: LOC.labelTr }, css: 'full' },
        { options: { propertyId: mkfData.IDS.TR_MIRROR, inputOnly: true }, css: 'full' },
        { options: { propertyId: mkfData.IDS.TR_SKEW_ROT_ORDER }, css: `full` },
        { options: { propertyId: mkfData.IDS.TR_ROTATION_ANCHOR, inputOnly: true }, css: `vsmall` },
        { options: { propertyId: mkfData.IDS.TR_ROTATION }, css: `large` },
        { options: { propertyId: mkfData.IDS.TR_SKEW_X } },
        { options: { propertyId: mkfData.IDS.TR_SKEW_Y } },
    ];

    static __exControls = [
        { options: { propertyId: mkfData.IDS.LYR_CUSTOM_ID } },
        { options: { propertyId: mkfData.IDS.INVERTED } },
        { options: { propertyId: mkfData.IDS.LYR_USE_PREV_LAYER } },
        { options: { propertyId: mkfData.IDS.LYR_IS_CONTROL_LAYER, command: mkfCmds.SetLayerControl, } },//directHidden: true 
    ];

    _Init() {
        super._Init();

        this._builder.defaultControlClass = nkm.datacontrols.widgets.ValueControl;
        this._builder.defaultCSS = `control`;

        this._trBuilder = new nkm.datacontrols.helpers.ControlBuilder(this);
        this._trBuilder.options = { cl: nkm.datacontrols.widgets.ValueControl, css: `foldout-item` };
        this.forwardData.To(this._trBuilder);
        this.forwardContext.To(this._trBuilder);
        this.forwardEditor.To(this._trBuilder);

        this._exBuilder = new nkm.datacontrols.helpers.ControlBuilder(this);
        this._exBuilder.options = { cl: nkm.datacontrols.widgets.ValueControl, css: `foldout-item` };
        this.forwardData.To(this._exBuilder);
        this.forwardContext.To(this._exBuilder);
        this.forwardEditor.To(this._exBuilder);

    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                //...nkm.style.rules.fadeIn,
                ...nkm.style.rules.flex.row.inlineNowrap,
                //'overflow': 'auto',
                //'padding': '10px',
                'align-content': 'flex-start',
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
            '.vvsmall': { 'flex': '1 1 3%' },
            '.large': { 'flex': '1 1 75%' },
            '.btn': {
                'flex': '0 0 32px',
                'margin': '0 2px 5px 2px',
            },
            '.foldout': {
                'flex': '1 1 100%',
            }
        }, base._Style());
    }

    _Render() {

        super._Render();

        let foldout = this.Attach(nkm.uilib.widgets.Foldout, `control foldout foldout-item`, this._body);
        foldout.options = { title: LOC.labelTrAdvanced, icon: `gear`, prefId: `lyr-advanced-tr`, expanded: false };
        this._trBuilder.host = foldout;
        this._trBuilder.Build(this.constructor.__trControls);

        foldout = this.Attach(nkm.uilib.widgets.Foldout, `control foldout foldout-item`, this._body);
        foldout.options = { title: LOC.labelSpecial, icon: `edit`, prefId: `lyr-advanced-ex`, expanded: false };
        this._exBuilder.host = foldout;
        this._exBuilder.Build(this.constructor.__exControls);

    }

}

module.exports = LayerTransformSettingsInspector;
ui.Register(`mkf-layer-transform-settings-inspector`, LayerTransformSettingsInspector);