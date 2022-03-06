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
        //{ options:{ propertyId:mkfData.IDS.FONT_STYLE } },
        //{ options:{ propertyId:mkfData.IDS.WEIGHT_CLASS } },
        //{ options:{ propertyId:mkfData.IDS.EM_UNITS } },
        //{ options:{ propertyId:mkfData.IDS.ASCENT } },
        //{ options:{ propertyId:mkfData.IDS.DESCENT } },
        //{ options:{ propertyId:mkfData.IDS.CAP_HEIGHT } },
        //{ options:{ propertyId:mkfData.IDS.X_HEIGHT } },
        //{ options:{ propertyId:mkfData.IDS.WIDTH } },
        //{ options:{ propertyId:mkfData.IDS.HEIGHT } },
        //{ options:{ propertyId:mkfData.IDS.UNDERLINE_POSITION } },
        //{ options:{ propertyId:mkfData.IDS.UNDERLINE_THICKNESS } },
        //{ options:{ propertyId:mkfData.IDS.H_ORIGIN_X } },
        //{ options:{ propertyId:mkfData.IDS.H_ORIGIN_Y } },
        //{ options:{ propertyId:mkfData.IDS.V_ORIGIN_X } },
        //{ options:{ propertyId:mkfData.IDS.V_ORIGIN_Y } },
    ];

    _Init() {
        super._Init();


        this._dataObserver
            .Hook(mkfData.SIGNAL.SUBFAMILY_CHANGED, this._OnSubFamilyChanged, this);

        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'min-width': '300px',
            },
            '.body': {
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'flex': '1 1 auto',
                'min-height': '0',
                'overflow': 'auto',
                'padding': '10px',
                'justify-content': 'center'
            },
            '.footer': {
                'flex': '0 0 auto',
                'width': 'auto',
                'padding': '10px',
                'display': 'flex',
                'flex-flow': 'column nowrap'
            },
            '.pangram': {
                'flex': '1 1 auto',
                'width': '100%',
            },
            '.slider': {
                'margin': '10px 0px 10px 0px'
            }
        }, super._Style());
    }

    _Render() {
        this._body = ui.dom.El(`div`, { class: `body` }, this._host);
        this._footer = ui.dom.El(`div`, { class: `footer` }, this._host);
        //this._builder.host = this._body;
        super._Render();
        this._pangramRenderer = this.Add(mkfWidgets.PangramRenderer, 'pangram', this._body);

        this._toolbar = this.Add(ui.WidgetBar, `toolbar`, this._footer);
        this._toolbar._defaultWidgetClass = nkm.uilib.buttons.Tool;
        this._toolbar.size = ui.FLAGS.SIZE_S;
        this._toolbar.CreateHandles(
            {
                icon: `text-direction-ltr`, group: 'direction',
                trigger: { fn: () => { this._pangramRenderer.direction = 'ltr'; } },
            },
            {
                icon: `text-direction-rtl`, group: 'direction',
                trigger: { fn: () => { this._pangramRenderer.direction = 'rtl'; } }
            },
            {
                icon: `text-align-left`, group: 'align',
                trigger: { fn: () => { this._pangramRenderer.align = `left` } }
            },
            {
                icon: `text-align-center`, group: 'align',
                trigger: { fn: () => { this._pangramRenderer.align = `center` } }
            },
            {
                icon: `text-align-right`, group: 'align',
                trigger: { fn: () => { this._pangramRenderer.align = `right` } },
            },
        );

        this._slider = this.Add(nkm.uilib.inputs.SliderOnly, `slider`, this._footer);
        this._slider.options = {
            min: 8, max: 72, currentValue: 20,
            size: ui.FLAGS.SIZE_XXS,
            onSubmit: { fn: this._Bind(this._UpdateFontSize) }
        }

        this._text = this.Add(nkm.uilib.inputs.Textarea, `text`, this._footer);
        this._text.options = {
            currentValue: `By Jove, my quick study of lexicography won a prize!`,
            //size: ui.FLAGS.SIZE_XXS,
            onSubmit: { fn: (p_i, p_t) => { this._pangramRenderer.text = p_t; } }
        }

        this._pangramRenderer.fontSize = 20;
    }

    _PreprocessData(p_data) {
        if (!nkm.utils.isInstanceOf(p_data, mkfData.Family)) { return null; }
        return p_data;
    }

    _OnDataChanged(p_oldData) {

        super._OnDataChanged(p_oldData);

        if (this._data) {
            this._OnSubFamilyChanged(this._data.selectedSubFamily);
        }

    }

    _OnSubFamilyChanged(p_subFamily) {
        this._builder.data = p_subFamily;
        this._pangramRenderer.data = p_subFamily;
    }


    _OnDisplayGain() {
        super._OnDisplayGain();
    }

    _OnDisplayLost() {
        super._OnDisplayLost();
    }

    _UpdateFontSize(p_input, p_value) {
        this._pangramRenderer.fontSize = p_value;
    }


}

module.exports = SubFamilyInspector;