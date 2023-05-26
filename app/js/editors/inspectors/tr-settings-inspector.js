'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const MiniHeader = nkm.datacontrols.widgets.MiniHeader;

const LOC = require(`../../locales`);
const mkfData = require(`../../data`);

// Manages what is shown & selectable in the viewport.

const isXMIN = (owner) => { return (owner.data.Get(mkfData.IDS.TR_HOR_ALIGN) == mkfData.ENUMS.HALIGN_XMIN); };// && owner.data.Get(mkfData.IDS.TR_SCALE_MODE) != mkfData.ENUMS.SCALE_NORMALIZE); };
const isMANUAL = (owner) => { return owner.data.Get(mkfData.IDS.TR_SCALE_MODE) == mkfData.ENUMS.SCALE_MANUAL; };
const isNRM = (owner) => { return owner.data.Get(mkfData.IDS.TR_SCALE_MODE) == mkfData.ENUMS.SCALE_NORMALIZE; };
const isRNRM = (owner) => { return owner.data.Get(mkfData.IDS.TR_SCALE_MODE) != mkfData.ENUMS.SCALE_NORMALIZE; };

const base = nkm.uilib.inspectors.ValueList;
class TransformSettingsInspector extends base {
    constructor() { super(); }

    static __controls = [
        { options: { propertyId: mkfData.IDS.TR_BOUNDS_MODE, inputOnly: true } },
        { cl: MiniHeader, options: { label: `Scaling` } },
        { options: { propertyId: mkfData.IDS.TR_SCALE_MODE, inputOnly: true }, css: 'large' },
        { options: { propertyId: mkfData.IDS.TR_SCALE_FACTOR }, requireData: true, hideWhen: { fn: isMANUAL } },
        { options: { propertyId: mkfData.IDS.TR_NRM_FACTOR }, requireData: true, hideWhen: { fn: isNRM } },
        { cl: MiniHeader, options: { label: `Anchoring & Alignment` } },
        { options: { propertyId: mkfData.IDS.TR_ANCHOR, inputOnly: true }, css: 'xsmall' },
        { options: { propertyId: mkfData.IDS.TR_VER_ALIGN, inputOnly: true }, css: 'small' },
        //{ cl: MiniHeader, options: { label: `Horizontal align` } },
        { options: { propertyId: mkfData.IDS.TR_HOR_ALIGN, inputOnly: true }, css: 'small' },

        { cl: MiniHeader, options: { label: LOC.labelOffsets }, requireData: true }, //, disableWhen: { fn: isXMIN }
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

        this._dataPreProcessor = (p_owner, p_data) => {
            if (nkm.u.isInstanceOf(p_data, mkfData.Glyph)) { return p_data.family.transformSettings; }
            if (nkm.u.isInstanceOf(p_data, mkfData.GlyphVariant)) { return p_data.glyph.family.transformSettings; }
            if (nkm.u.isInstanceOf(p_data, mkfData.Family)) { return p_data.transformSettings; }
            return p_data;
        };

    }

    _Render() {

        super._Render();

        nkm.uilib.views.ControlsFoldout.Build(this, {
            title: LOC.labelTrAdvanced,
            icon: `gear`,
            prefId: `advanced-tr`,
            expanded: false,
            controls: this.constructor.__trControls
        });

    }


}

module.exports = TransformSettingsInspector;