const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

// Manages what is shown & selectable in the viewport.

class TransformSettingsInspector extends nkm.datacontrols.InspectorView {
    constructor() { super(); }

    static __controls = [
        { cl: mkfWidgets.ControlHeader, options: { label: `Boundaries` }, css:'header' },
        { options: { propertyId: mkfData.IDS.TR_REFERENCE, inputOnly:true }, css:'small' },
        { options: { propertyId: mkfData.IDS.TR_SCALE_MODE, inputOnly:true }, css:'small' },
        { options: { propertyId: mkfData.IDS.TR_SCALE_FACTOR }, requireData:true, hideWhen:{ fn:(owner)=>{ return owner.data.Get(mkfData.IDS.TR_SCALE_MODE).value == 4; } } },
        { cl: mkfWidgets.ControlHeader, options: { label: `Vertical align` }, css:'header' },
        { options: { propertyId: mkfData.IDS.TR_VER_ALIGN, inputOnly:true }, css:'small' },
        { options: { propertyId: mkfData.IDS.TR_VER_ALIGN_ANCHOR, inputOnly:true }, css:'small' },
        { cl: mkfWidgets.ControlHeader, options: { label: `Horizontal align` }, css:'header' },
        { options: { propertyId: mkfData.IDS.TR_HOR_ALIGN, inputOnly:true }, css:'small' },
        { options: { propertyId: mkfData.IDS.TR_HOR_ALIGN_ANCHOR, inputOnly:true }, css:'small' },
        { cl: mkfWidgets.ControlHeader, options: { label: `Advance` }, css:'header', requireData:true, hideWhen:{ fn:(owner)=>{ return owner.data.Get(mkfData.IDS.TR_HOR_ALIGN).value == 0; } } },
        { options: { propertyId: mkfData.IDS.TR_WIDTH_SHIFT }, requireData:true, hideWhen:{ fn:(owner)=>{ return owner.data.Get(mkfData.IDS.TR_HOR_ALIGN).value == 0; } } },
        { options: { propertyId: mkfData.IDS.TR_WIDTH_PUSH }, requireData:true, hideWhen:{ fn:(owner)=>{ return owner.data.Get(mkfData.IDS.TR_HOR_ALIGN).value == 0; } } },
    ];

    _Init() {
        super._Init();

        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;

        this._dataPreProcessor = (p_owner, p_data) => {
            if (nkm.utils.isInstanceOf(p_data, mkfData.Glyph)) { return p_data.family.transformSettings; }
            if (nkm.utils.isInstanceOf(p_data, mkfData.GlyphVariant)) { return p_data.glyph.family.transformSettings; }
            if (nkm.utils.isInstanceOf(p_data, mkfData.SubFamily)) { return p_data.family.transformSettings; }
            if (nkm.utils.isInstanceOf(p_data, mkfData.Family)) { return p_data.transformSettings; }
            return p_data;
        };
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                '@':['fade-in'],
                'display': 'flex',
                'flex-flow': 'row wrap',
                //'min-height': '0',
                //'overflow': 'auto',
                //'padding': '10px',
                'align-content': 'flex-start',
            },
            '.control': {
                'flex': '1 1 auto',
                'margin': '0 2px 5px 2px'
            },
            '.small': {
                'flex': '1 1 45%'
            },
            '.header': {
                'margin': '5px 2px 5px 2px'
            }
        }, super._Style());
    }

    //#region Family properties

    //#endregion

    _CleanUp(){
        if (this.constructor.__clearBuilderOnRelease) { this._builder.Clear(); }
        super._CleanUp();
    }

}

module.exports = TransformSettingsInspector;
ui.Register(`mkf-transform-settings-inspector`, TransformSettingsInspector);