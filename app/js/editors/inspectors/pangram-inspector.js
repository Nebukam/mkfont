'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const operations = require(`../../operations/index`);

const UNICODE = require(`../../unicode`);
const SIGNAL = require(`../../signal`);

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfOperations = require(`../../operations`);

const GlyphVariantInspector = require(`./glyph-iitem`);

const longPangram =
    `Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.

Ut wisi enim ad minim veniam, quis nostrud exercitation ulliam corper suscipit lobortis nisl ut aliquip ex ea commodo consequat.`;

const base = nkm.datacontrols.InspectorView;
class PangramInspector extends base {
    constructor() { super(); }

    static __defaultInstanceOf = mkfData.Family;
    static __controls = [
        //{ options:{ propertyId:mkfData.IDS.FONT_STYLE } },
    ];

    _Init() {
        super._Init();
        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;

        this._inspectionHandler = new nkm.datacontrols.helpers.InspectionDataHandler(this);
        this._inspectionHandler
            .Watch(nkm.com.SIGNAL.UPDATED, this._OnSelectionUpdated, this);
    }

    static _Style() {
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
            '.item': {
                'margin-bottom': `4px`
            },
            '.sliders': {
                'display': 'flex',
                'flex-flow': 'row wrap',
                'align-items': 'center',
                'margin': '10px 0px 10px 0px'
            },
            '.sliders .item': {
                'flex': '1 1 50%',
            },
            '.pangram': {
                'flex': '1 1 auto',
                'width': '100%',
            },
            '.slider': {
                //'margin': '10px 0px 10px 0px'
            }
        }, base._Style());
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

        let slidersCtnr = ui.El(`div`, { class: `sliders` }, this._footer);

        let label = new ui.manipulators.Text(ui.El(`span`, { class: 'label item' }, slidersCtnr));
        label.Set(`Font size (px)`, true);
        let slider = this.Attach(nkm.uilib.inputs.Slider, `item slider`, slidersCtnr);
        slider.options = {
            min: 8, max: 144, currentValue: 20,
            size: ui.FLAGS.SIZE_XS,
            onSubmit: { fn: (p_input, p_value) => { this._pangramRenderer.fontSize = p_value; } }
        }

        label = new ui.manipulators.Text(ui.El(`span`, { class: 'label item' }, slidersCtnr));
        label.Set(`Line height (em)`, true);
        label._element.setAttribute(`title`, `'em' units are relative to font size.\nOne em = 100% of the font size.`);
        slider = this.Attach(nkm.uilib.inputs.Slider, `item slider`, slidersCtnr);
        slider.options = {
            min: 0.1, max: 10, step: 0.01, currentValue: 1,
            size: ui.FLAGS.SIZE_XS,
            onSubmit: { fn: (p_input, p_value) => { this._pangramRenderer.lineHeight = p_value; } }
        }

        this._text = this.Attach(nkm.uilib.inputs.Textarea, `item text`, this._footer);
        this._text.options = {
            currentValue: longPangram,
            onSubmit: { fn: (p_i, p_t) => { this._pangramRenderer.text = p_t; } },
            rows: 6
        }

        this._pangramRenderer.fontSize = 20;
        this._pangramRenderer.lineHeight = 1;
        this._pangramRenderer.text = longPangram;
        this._pangramRenderer.Watch(nkm.com.SIGNAL.VALUE_CHANGED, this._OnTextSelected, this);

        this._footerToolbar = this.Attach(ui.WidgetBar, `item toolbar`, this._footer);
        this._footerToolbar.options = {
            inline: true,
            stretch: ui.WidgetBar.FLAG_STRETCH,
            defaultWidgetClass: nkm.uilib.buttons.Button,
            handles: [
                {
                    label: `Refresh preview`, icon: `refresh`,
                    trigger: {
                        fn: () => { this._data._fontCache._RebuildCache(); },
                        thisArg: this
                    }
                }
            ]
        }

    }

    _OnEditorChanged(p_oldEditor) { this._inspectionHandler.editor = this._editor; }

    _OnSelectionUpdated(p_sel) {
        if (p_sel.stack.count == 0) {
            this._pangramRenderer.highlightList = null;
            return;
        }

        let hlist = [];
        p_sel.stack.ForEach((infos) => {
            hlist.push(infos.char);
        });

        this._pangramRenderer.highlightList = hlist;

    }

    _OnTextSelected(p_text) {

        ui.dom.ClearHighlightedText();

        let addresses = UNICODE.GetAddressesFromText(p_text);

        if (addresses.length == 0) { return; }

        let data = [];
        for (let i = 0; i < addresses.length; i++) {
            let glyph = this._data.GetGlyph(addresses[i]);
            if (glyph.isNull) { continue; }
            data.push(glyph.unicodeInfos);
        }

        if (data.length == 0) { return; }

        this.editor.viewport.selectionStack.Clear();
        this.editor.inspectedData.SetList(data.reverse());

    }

}

module.exports = PangramInspector;