const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;
const lists = nkm.uilib.lists;

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const GlyphCanvasRenderer = require(`../glyph-canvas-renderer`);

const __outOfRange = `outOfRange`;
const __skipped = `ignored`;

class ImportListItem extends nkm.datacontrols.ControlWidget {
    constructor() { super(); }

    static __draggable = false;

    _Init() {
        super._Init();
        this._Bind(this._UpdatePreview);
        this._Bind(this._OnSubmit);
        this._flags.Add(this, __outOfRange, __skipped);
    }

    _PostInit() {
        super._PostInit();
        this.focusArea = this;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'grid',
                'grid-template-rows': `5px 28px 28px`,
                'grid-template-columns': `max-content min-content 1fr`,
                'align-items': `center`,
                'padding': `5px`
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
                            this._data.userDoCustom = p_value;
                            this._unicodeInputField.disabled = !p_value;
                            this._Reprocess();
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

    }

    _OnEditorChanged(p_oldEditor) {
        this._subFamily = this._editor ? this._editor._subFamily : null;
    }

    Activate(p_evt) {
        if (!super.Activate(p_evt)) { return false; }
        this.editor.inspectedData.Set(this._data);
        return true;
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        if (this._data) {
            this._transformSettings = this._data.transforms;
            this._transformSettings.Watch(nkm.com.SIGNAL.UPDATED, this._UpdatePreview);
        } else {
            if (this._transformSettings) {
                this._transformSettings.Unwatch(nkm.com.SIGNAL.UPDATED, this._UpdatePreview);
                this._transformSettings = null;
            }
        }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this.Update();
    }

    Update() {

        //TODO: Update widget display based on current data & import settings

        this._unicodeInputField.placeholderValue = this._data.placeholder;

        let
            useCustom = this._data.userDoCustom,
            targetUnicode = this._data.targetUnicode,
            mode = this._data.transforms.Get(mkfData.IDS_EXT.IMPORT_OVERLAP_MODE),
            OoR = this._data.outOfRange,
            skipped = (mode == mkfData.ENUMS.OVERLAP_PRESERVE && this._data.variant);

        this._unicodeInputField.disabled = !useCustom;
        this._useCustomUniCheckbox.currentValue = useCustom;

        this._flags.Set(__outOfRange, OoR);
        this._flags.Set(__skipped, skipped);

        if (useCustom) {
            this._unicodeInputField.currentValue = this._data.userInput;
        } else {
            this._unicodeInputField.currentValue = ``;
        }

        if (!targetUnicode || targetUnicode.length == 0) {
            this._outputLabel.Set(`<span style='color:var(--col-warning)'>Invalid or empty : will be ignored.</span>`);
        } else {
            let unichars = [];
            targetUnicode.forEach((val) => { unichars.push(UNICODE.GetUnicodeCharacter(Number.parseInt(val, 16))); });
            this._outputLabel.Set(targetUnicode.join(`<span style='opacity:0.5'>+</span>`) + ` = <b>${unichars.join(``)}</b>`);
        }

        this._UpdatePreview();

    }

    _UpdatePreview() {

        let subFamily = this.editor._subFamily,
            contextInfos = subFamily._contextInfos,
            pathData = this._data.svgStats,
            transformedPath = SVGOPS.FitPath(
                this._data.transforms,
                contextInfos,
                pathData
            );

        this._glyphRenderer.contextInfos = contextInfos;
        this._glyphRenderer.glyphWidth = transformedPath.width;
        this._glyphRenderer.glyphPath = transformedPath.path;
        this._glyphRenderer.Draw();

    }

    _OnSubmit(p_input, p_value) {
        this._data.userInput = p_value;
        this._Reprocess();
    }

    _Reprocess() {
        this.editor._assignManager._ProcessSingle(this._data);
        this.Update();
    }

    _CleanUp() {
        this._cmd = null;
        super._CleanUp();
    }

}

module.exports = ImportListItem;
ui.Register(`mkfont-import-list-item`, ImportListItem);