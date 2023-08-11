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
    `Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt.

    Ut laoreet dolore magna aliquam erat volutpat.`;

const base = nkm.datacontrols.InspectorView;
class PangramInspector extends base {
    constructor() { super(); }

    static __defaultInstanceOf = mkfData.Family;
    static __controls = [
        //{ options:{ propertyId:mkfData.IDS.FONT_STYLE } },
    ];

    _Init() {
        super._Init();
        this._builder.defaultControlClass = nkm.datacontrols.widgets.ValueControl;
        this._builder.defaultCSS = `control`;

        this._inspectionHandler = new nkm.datacontrols.helpers.InspectionDataHandler(this);
        this._inspectionHandler
            .Watch(nkm.com.SIGNAL.UPDATED, this._OnSelectionUpdated, this);
    }

    _PostInit() {
        super._PostInit();
        this.ligaText = null;
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                ...nkm.style.flex.column,
            },
            '.body': {
                ...nkm.style.flex.column,
                ...nkm.style.flexItem.fill,
                ...nkm.style.rules.gap.small,
                'overflow': 'auto',
                'padding': '10px',
                'justify-content': 'center'
            },
            '.footer': {
                ...nkm.style.flex.column,
                ...nkm.style.flexItem.fixed,
                'width': 'auto',
                'padding': '10px',
            },
            '.item': {
                'margin-bottom': `4px`
            },
            '.sliders': {
                ...nkm.style.flex.rows,
                'gap':'8px 0',
                'align-items': 'center',
                'margin': '10px 0px 10px 0px'
            },
            '.sliders .item': {
                'flex': '1 1 50%',
            },
            '.pangram': {
                ...nkm.style.flexItem.fill,
                'width': '100%',
                'overflow-y': 'auto'
            },
            '.slider': {
                //'margin': '10px 0px 10px 0px'
            },
            '.toolbar': {
                'margin-top': `10px`
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

        this._createLigaBtn = this.Attach(nkm.uilib.buttons.Button, `item`, this._footer);
        this._createLigaBtn.options = {
            icon:`text-liga-new`, htitle: `Create a ligature from the selected text.\n---\n+ [ Shift ] Create components from ligature decomposition.`,
            trigger: { fn: () => { this.editor.cmdLigaFromSelection.Execute(this._selText); } }
        };

        this._toolbar = this.Attach(ui.WidgetBar, `item toolbar`, this._footer);
        this._toolbar.options = {
            defaultWidgetClass: nkm.uilib.inputs.SelectInline,
            size: ui.FLAGS.SIZE_S,
            stretch: ui.FLAGS.STRETCH_SQUEEZE,
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
            onSubmit: {
                fn: (p_i, p_t) => {
                    if (p_t == ``) { p_t = longPangram; }
                    this._pangramRenderer.text = p_t;
                }
            },
            rows: 4
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
                    label: `Reload`, icon: `refresh`,
                    trigger: {
                        fn: () => { this._data._fontCache._RebuildCache(); },
                        thisArg: this
                    }
                },
                {
                    icon: `reset`,
                    htitle: `Set the text to be the default lorem ipsum.`,
                    trigger: {
                        fn: () => {
                            this._text.handler.changedValue = longPangram;
                            this._text.handler.SubmitValue();
                        },
                        thisArg: this
                    }, group: `a`
                },
                {
                    icon: `plus`,
                    htitle: `Append the current selection at the end of the current text\n---\n+ [ Shift ] Separate each characters by an space.`,
                    trigger: {
                        fn: () => {
                            let txt = ``, space = ui.INPUT.shiftKey ? ` ` : ``;
                            this.editor.inspectedData.stack.forEach(i => { txt += `${i.char}${space}` }, true);
                            txt = this._text.handler.currentValue + txt;
                            this._text.handler.changedValue = txt == `` ? longPangram : txt;
                            this._text.handler.SubmitValue();
                        },
                        thisArg: this
                    }, group: `b`
                },
                {
                    icon: `text`,
                    htitle: `Set the text to be the current viewport selection.\n---\n+ [ Shift ] Separate each characters by an space.`,
                    trigger: {
                        fn: () => {
                            let txt = ``, space = ui.INPUT.shiftKey ? ` ` : ``;
                            this.editor.inspectedData.stack.forEach(i => { txt += `${i.char}${space}` }, true);
                            this._text.handler.changedValue = txt == `` ? longPangram : txt;
                            this._text.handler.SubmitValue();
                        },
                        thisArg: this
                    }, group: `b`

                }
            ]
        }

    }

    _OnEditorChanged(p_oldEditor) { this._inspectionHandler.editor = this._editor; }
    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        this.ligaText = null;
    }

    set ligaText(p_value) {
        if (!p_value) { p_value = ``; }

        this._selText = p_value;

        if (p_value.length < 2) {
            this._createLigaBtn.disabled = true;
            this._createLigaBtn.label = `Select at least 2 characters`;
            return;
        }
        this._createLigaBtn.disabled = false;
        this._createLigaBtn.label = `${this._selText}`;
    }

    _OnSelectionUpdated(p_sel) {
        if (!p_sel.stack.length) {
            this._pangramRenderer.highlightList = null;
            return;
        }

        let hlist = [];
        p_sel.stack.forEach((infos) => {
            hlist.push(infos.char);
        });

        this._pangramRenderer.highlightList = hlist;

    }

    _OnTextSelected(p_text) {

        ui.dom.ClearHighlightedText();

        this.ligaText = p_text;

        let addresses = UNICODE.GetAddressesFromText(p_text);

        if (addresses.length == 0) { return; }

        let data = [];
        addresses.forEach(add => {
            let nfos = UNICODE.GetInfos(add, false);
            if (nfos) { data.push(nfos) }
        });
        /*
                for (let i = 0; i < addresses.length; i++) {
                    let glyph = this._data.GetGlyph(addresses[i]);
                    if (glyph.isNull) { continue; }
                    data.push(glyph.unicodeInfos);
                }
        */
        if (data.length == 0) { return; }

        this.editor.viewport.selectionStack.Clear();
        this.editor.inspectedData.SetList(data); //.reverse()

    }

}

module.exports = PangramInspector;