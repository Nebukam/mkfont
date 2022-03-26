const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;
const lists = nkm.uilib.lists;

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const GlyphCanvasRenderer = require(`../glyph-canvas-renderer`);

class ImportListItem extends lists.FolderListItem {
    constructor() { super(); }

    static __draggable = false;

    _Init() {
        super._Init();
        this._Bind(this._UpdatePreview);
        this._Bind(this._OnSubmit);

        this._extensions.Remove(this._extDrag);
        this._dataObserver.Hook(nkm.com.SIGNAL.VALUE_CHANGED, this._OnDataUpdated, this);
    }

    _PostInit() {
        super._PostInit();
        //this.focusArea = this;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'grid',
                'grid-template-rows': `5px 28px 28px`,
                'grid-template-columns': `max-content min-content 1fr`,
                'align-items': `center`,
                'padding-bottom': `5px`
            },
            '.renderer': {
                'position': 'relative',
                'aspect-ratio': '1/1',
                'width': '52px',
                'border-radius': '3px',
                'background-color': '#1b1b1b',
                'grid-column': '1',
                'grid-row': '2 / span 2',
                'align-self': `flex-start`,

            },
            '.hidden': {
                'display': 'none',
            },
            '.label': {
                'position': 'relative',
                'grid-column': '1 / span 3',
                'grid-row': '1',
            },
            '.toolbar': {
                'grid-column': '2 / span 2',
                'grid-row': '2',
                'align-self': `flex-start`,
                'margin-left': `4px`,
            },
            '.output': {
                'grid-column': '2 / span 2',
                'grid-row': '3',
                'margin-left': `6px`,
                'padding': `3px`,
                'padding-left': `6px`,
                //'background-color': `rgba(127,127,127,0.05)`,
                'border-radius': '3px'
            }
        }, super._Style());
    }

    _Render() {

        this._glyphRenderer = this.Attach(GlyphCanvasRenderer, `renderer`, this._host);
        //this._glyphRenderer.centered = true;
        super._Render();
        this._label.element.classList.add(`hidden`);

        this._outputLabel = new ui.manipulators.Text(ui.El(`div`, { class: `output label font-xsmall` }, this._host));
        this._outputLabel.ellipsis = true;

        this._tb = this.Attach(ui.WidgetBar, `toolbar`, this._host);
        this._tb.options = {
            //inline: true,
            stretch: ui.WidgetBar.FLAG_STRETCH,
            size: ui.FLAGS.SIZE_XS,
            defaultWidgetClass: nkm.uilib.buttons.Tool,
            handles: [
                {
                    cl: uilib.inputs.Checkbox,
                    onSubmit: {
                        fn: (p_input, p_value) => {
                            this._data.SetOption(`use-custom-unicode`, p_value);
                            this._unicodeInputField.disabled = !p_value;
                        }
                    },
                    group: `read`, member: { owner: this, id: `_useCustomUniCheckbox` }
                },
                {
                    cl: uilib.inputs.Text,
                    variant: ui.FLAGS.MINIMAL,
                    onSubmit: { fn: this._OnSubmit },
                    group: `read`, member: { owner: this, id: `_unicodeInputField` }
                },
            ]
        };

        this._icon.element.remove();
    }

    Activate(p_evt) {
        if (!super.Activate(p_evt)) { return false; }

        let editor = nkm.datacontrols.FindEditor(this);
        if (editor) { editor.Inspect(this._data); }

        return true;
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        if (this._data) {
            this._subFamily = this._data.GetOption(`subFamily`);
            this._transformSettings = this._data.GetOption(`transforms`);
            this._transformSettings.Watch(nkm.com.SIGNAL.UPDATED, this._UpdatePreview);

        } else {
            if (this._transformSettings) { this._transformSettings.Unwatch(nkm.com.SIGNAL.UPDATED, this._UpdatePreview); }
        }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);

        let
            useCustom = this._data.GetOption(`use-custom-unicode`, false),
            uniStruct = null;
        this._unicodeInputField.disabled = !useCustom;
        this._useCustomUniCheckbox.currentValue = useCustom;

        if (useCustom) {
            uniStruct = this._data.GetOption(`unicode-user-input`, ``);
            this._unicodeInputField.placeholderValue = `custom...`;
            this._unicodeInputField.currentValue = uniStruct;
        } else {
            uniStruct = this._data.GetOption(`name`, ``);
            this._unicodeInputField.placeholderValue = uniStruct;
            this._unicodeInputField.currentValue = this._data.GetOption(`name`, ``)
        }

        let editor = nkm.datacontrols.FindEditor(this);

        uniStruct = editor._FindUnicodeStructure(uniStruct);
        //uniStruct.forEach((val) => { displayValue.push(UNICODE.GetUnicodeCharacter(Number.parseInt(val, 16))); });

        if (!uniStruct || uniStruct.length == 0) {
            this._outputLabel.Set(`<span style='color:var(--col-warning)'>invalid, will be ignored.</span>`);
        } else {
            let unichars = [];
            uniStruct.forEach((val) => { unichars.push(UNICODE.GetUnicodeCharacter(Number.parseInt(val, 16))); });
            this._outputLabel.Set(uniStruct.join(`<span style='opacity:0.5'>+</span>`) + ` = <b>${unichars.join(``)}</b>`);
        }

        this._UpdatePreview();
    }

    _UpdatePreview() {

        let subFamily = this._data.GetOption(`subFamily`),
            contextInfos = subFamily._contextInfos,
            pathData = this._data.GetOption(`svgStats`),
            transformedPath = SVGOPS.FitPath(
                this._data.GetOption(`transforms`),
                contextInfos,
                pathData
            );

        this._glyphRenderer.contextInfos = contextInfos;
        this._glyphRenderer.glyphWidth = transformedPath.width;
        this._glyphRenderer.glyphPath = transformedPath.path;
        this._glyphRenderer.Draw();

    }

    _OnSubmit(p_input, p_value) {
        this._data.SetOption(`unicode-user-input`, p_value);
    }

    _Cleanup() {
        this._cmd = null;
        super._Cleanup();
    }

}

module.exports = ImportListItem;
ui.Register(`mkfont-import-list-item`, ImportListItem);