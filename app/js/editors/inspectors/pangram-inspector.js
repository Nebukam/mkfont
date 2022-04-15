'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const operations = require(`../../operations/index`);

const SIGNAL = require(`../../signal`);

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfOperations = require(`../../operations`);

const GlyphVariantInspector = require(`./glyph-iitem`);

const longPangram =
    `Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.

Ut wisi enim ad minim veniam, quis nostrud exercitation ulliam corper suscipit lobortis nisl ut aliquip ex ea commodo consequat.`;

class PangramInspector extends nkm.datacontrols.InspectorView {
    constructor() { super(); }

    static __defaultInstanceOf = mkfData.Family;
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
        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                'display': 'flex',
                'flex-flow': 'column nowrap',
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
            '.item':{
                'margin-bottom':`4px`
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

        this._header = this.Attach(mkfWidgets.InspectorHeader, `header`, this._host);
        this._header.options = { title: `Text preview`, icon: `text` };

        this._body = ui.dom.El(`div`, { class: `body` }, this._host);

        this._footer = ui.dom.El(`div`, { class: `footer` }, this._host);

        super._Render();

        this._pangramRenderer = this.Attach(mkfWidgets.PangramRenderer, 'pangram', this._body);
        this.forwardData.To(this._pangramRenderer);

        this._toolbar = this.Attach(ui.WidgetBar, `item toolbar`, this._footer);
        this._toolbar.options = {
            defaultWidgetClass: nkm.uilib.inputs.InlineSelect,
            size: ui.FLAGS.SIZE_S,
            stretch: ui.WidgetBar.FLAG_STRETCH_SQUEEZE,
            inline: true,
            handles: [
                {
                    catalog: mkfData.ENUMS.PANGRAM_DIR,
                    onSubmit: { fn: (p_input, p_value) => { this._pangramRenderer.direction = p_value.value; } },
                    currentValue: mkfData.ENUMS.PANGRAM_DIR.At(0)
                },
                {
                    catalog: mkfData.ENUMS.PANGRAM_ALIGN,
                    onSubmit: { fn: (p_input, p_value) => { this._pangramRenderer.align = p_value.value; } },
                    currentValue: mkfData.ENUMS.PANGRAM_ALIGN.At(0)
                },
                {
                    catalog: mkfData.ENUMS.PANGRAM_TEXT_TRANSFORM,
                    onSubmit: { fn: (p_input, p_value) => { this._pangramRenderer.case = p_value.value; } },
                    currentValue: mkfData.ENUMS.PANGRAM_TEXT_TRANSFORM.At(0)
                }
            ]
        };

        this._slider = this.Attach(nkm.uilib.inputs.SliderOnly, `item slider`, this._footer);
        this._slider.options = {
            min: 8, max: 72, currentValue: 20,
            size: ui.FLAGS.SIZE_XXS,
            onSubmit: { fn: this._Bind(this._UpdateFontSize) }
        }

        this._text = this.Attach(nkm.uilib.inputs.Textarea, `item text`, this._footer);
        this._text.options = {
            currentValue: longPangram,
            onSubmit: { fn: (p_i, p_t) => { this._pangramRenderer.text = p_t; } },
            rows:6
        }

        this._pangramRenderer.fontSize = 20;
        this._pangramRenderer.text = longPangram;

        this._footerToolbar = this.Attach(ui.WidgetBar, `item toolbar`, this._footer);
        this._footerToolbar.options = {
            inline: true,
            stretch: ui.WidgetBar.FLAG_STRETCH,
            defaultWidgetClass: nkm.uilib.buttons.Button,
            handles: [
                {
                    label: `Rebuild font`, icon: `clear`,
                    flavor: nkm.com.FLAGS.WARNING, variant: ui.FLAGS.MINIMAL,
                    trigger: {
                        fn: () => { this._data._fontCache._RebuildCache(); },
                        thisArg: this
                    }
                }
            ]
        }

    }

    _UpdateFontSize(p_input, p_value) {
        this._pangramRenderer.fontSize = p_value;
    }


}

module.exports = PangramInspector;