'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const operations = require(`../../operations/index`);

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfOperations = require(`../../operations`);

const GlyphVariantInspector = require(`./glyph-iitem`);

class SubFamilyInspector extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    static __controls = [
        { options:{ propertyId:mkfData.IDS.FONT_STYLE } },
        { options:{ propertyId:mkfData.IDS.WEIGHT_CLASS } },
        { options:{ propertyId:mkfData.IDS.EM_UNITS } },
        { options:{ propertyId:mkfData.IDS.ASCENT } },
        { options:{ propertyId:mkfData.IDS.DESCENT } },
        //{ options:{ propertyId:mkfData.IDS.CAP_HEIGHT } },
        //{ options:{ propertyId:mkfData.IDS.X_HEIGHT } },
        { options:{ propertyId:mkfData.IDS.WIDTH } },
        { options:{ propertyId:mkfData.IDS.HEIGHT } },
        //{ options:{ propertyId:mkfData.IDS.UNDERLINE_POSITION } },
        //{ options:{ propertyId:mkfData.IDS.UNDERLINE_THICKNESS } },
        //{ options:{ propertyId:mkfData.IDS.H_ORIGIN_X } },
        //{ options:{ propertyId:mkfData.IDS.H_ORIGIN_Y } },
        //{ options:{ propertyId:mkfData.IDS.V_ORIGIN_X } },
        //{ options:{ propertyId:mkfData.IDS.V_ORIGIN_Y } },
    ];

    _Init() {
        super._Init();

        this._svgPaste = operations.commands.ClipboardReadSVG;
        //this._builder.preProcessDataFn = this._Bind(this._PreprocessControlData);
        //TODO ::: IDS.ASCENT => this._Bind(this._SetAscent)

        this._dataObserver
            .Hook(mkfData.SIGNAL.SUBFAMILY_CHANGED, this._OnSubFamilyChanged, this);

        this._subFamily = null;

        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;


    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'min-width': '300px'
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
                'flex': '0 1 auto',
                'margin-bottom': '5px'
            },
            '.pangram': {
                'flex': '1 1 auto',
            }
        }, super._Style());
    }

    _Render() {
        this._body = ui.dom.El(`div`, { class: `body` }, this._host);
        this._builder.host = this._body;
        super._Render();
    }

    _PreprocessData(p_data) {
        if (!nkm.utils.isInstanceOf(p_data, mkfData.Family)) { return null; }
        return p_data;
    }

    _OnDataChanged(p_oldData) {

        super._OnDataChanged(p_oldData);

        if (this._data) {
            this._subFamily = this._data.selectedSubFamily;
            this._OnSubFamilyChanged(this._subFamily);
        }

    }

    _OnSubFamilyChanged(p_selectedSubFamily) {

        this._subFamily = p_selectedSubFamily;

        if (!p_selectedSubFamily) { return; }

        this._builder.data = p_selectedSubFamily;

    }


    _OnDisplayGain() {
        super._OnDisplayGain();
        this._svgPaste.emitter = this;
        this._svgPaste.Enable();
    }

    _OnDisplayLost() {
        super._OnDisplayLost();
        if (this._svgPaste.emitter == this) { this._svgPaste.Disable(); }
    }

    // Special actions

    _SetAscent(p_id, p_value) {
        this._Do(mkfOperations.actions.SetAscent, {
            subFamily: this._subFamily,
            ascent: p_value
        });
    }

}

module.exports = SubFamilyInspector;