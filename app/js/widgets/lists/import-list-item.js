const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;
const lists = nkm.uilib.lists;

const mkfData = require(`../../data`);
const GlyphCanvasRenderer = require(`../glyph-canvas-renderer`);

class ImportListItem extends lists.FolderListItem {
    constructor() { super(); }

    static __draggable = false;

    _Init() {
        super._Init();
        this._Bind(this._UpdatePreview);
        this._extensions.Remove(this._extDrag);
    }

    _PostInit() {
        super._PostInit();
        //this.focusArea = this;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'grid',
                'grid-template-rows': `32px max-content`,
                'grid-template-columns': `max-content min-content 1fr`,
                'align-items': `center`
            },
            '.renderer': {

                'aspect-ratio': '1/1',
                'width': '55px',
                'margin': '5px 5px 5px 0',
                'border-radius': '3px',
                'background-color': '#1b1b1b',
                'grid-column': '1',
                'grid-row': '1 / span 2',

            },
            '.icon': {
                'grid-column': '2',
                'grid-row': '1',
            },
            '.label': {
                'grid-column': '3',
                'grid-row': '1',
            },
            '.toolbar': {
                'grid-column': '2 / span 2',
                'grid-row': '2',
                'align-self': `flex-start`,
                'margin-left': `4px`,
            }
        }, super._Style());
    }

    _Render() {
        this._glyphRenderer = this.Add(GlyphCanvasRenderer, `renderer`, this._host);
        //this._glyphRenderer.centered = true;
        super._Render();
        this._tb = this.Add(ui.WidgetBar, `toolbar`, this._host);
        this._tb.options = {
            //inline: true,
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
                    variant: ui.FLAGS.MINIMAL,/*
                    trigger: {
                        fn: () => {
                            mkfOperations.commands.ImportExternalFile.emitter = this;
                            mkfOperations.commands.ImportExternalFile.Execute(this._data);
                        }
                    },*/
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

            let customUnicode = this._data.GetOption(`use-custom-unicode`, false);
            this._unicodeInputField.disabled = !customUnicode;
            this._useCustomUniCheckbox.currentValue = customUnicode;

            if (customUnicode) {
                this._unicodeInputField.placeholderValue = `xxx`;
                this._unicodeInputField.currentValue = ``;
            } else {
                this._unicodeInputField.placeholderValue = `imported value`;
                this._unicodeInputField.currentValue = this._data.GetOption(`unicode-value`, `---`);
            }
        } else {
            if (this._transformSettings) { this._transformSettings.Unwatch(nkm.com.SIGNAL.UPDATED, this._UpdatePreview); }
        }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
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

    _Cleanup() {
        this._cmd = null;
        super._Cleanup();
    }

}

module.exports = ImportListItem;
ui.Register(`mkfont-import-list-item`, ImportListItem);