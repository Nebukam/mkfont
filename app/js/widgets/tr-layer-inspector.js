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

const base = nkm.uilib.inspectors.ValueList;
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
        { options: { propertyId: mkfData.IDS.TR_ANCHOR, inputOnly: true }, css: 'xsmall' },
        { options: { propertyId: mkfData.IDS.TR_LYR_BOUNDS_MODE, inputOnly: true }, css: 'small' },

        { options: { propertyId: mkfData.IDS.TR_LYR_SELF_ANCHOR, inputOnly: true }, css: 'xsmall' },
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
        { options: { propertyId: mkfData.IDS.TR_ROTATION_ANCHOR, inputOnly: true }, css: `xsmall` },
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

    static __foldouts = [
        {
            title: LOC.labelTrAdvanced,
            icon: `gear`,
            prefId: 'lyr-advanced-tr',
            expanded: false,
            controls: this.__trControls,
        },
        {
            title: LOC.labelSpecial,
            icon: `edit`,
            prefId: `lyr-advanced-ex`,
            expanded: false,
            controls: this.__exControls,
        }
    ];

}

module.exports = LayerTransformSettingsInspector;
ui.Register(`mkf-layer-transform-settings-inspector`, LayerTransformSettingsInspector);