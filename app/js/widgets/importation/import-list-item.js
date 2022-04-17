const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;
const lists = nkm.uilib.lists;

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const GlyphCanvasRenderer = require(`../glyph-canvas-renderer`);

const __outOfRange = `outOfRange`;
const __preserved = `preserved`;
const __ignored = `ignored`;
const __new = `new`;

class ImportListItem extends nkm.datacontrols.ControlWidget {
    constructor() { super(); }

    static __draggable = false;

    _Init() {
        super._Init();
        this._Bind(this._UpdatePreview);
        this._Bind(this._OnSubmit);
        this._flags.Add(this, __outOfRange, __preserved, __ignored, __new);
    }

    _PostInit() {
        super._PostInit();
        this.focusArea = this;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'grid',
                'grid-template-rows': `28px 28px`,
                'grid-template-columns': `max-content auto`,
                'align-items': `center`,
                'padding': `5px 10px`
            },
            ':host(.outOfRange)': {
                'opacity': '0.4'
            },
            ':host(.preserved):before': {
                //'content': `""`,
                '@': ['absolute-left'],
                'width': `10px`, 'height': `10px`,
                'margin-top': `-25px`,
                'margin-left': `54px`,
                'border-radius': `3px`,
                'background-color': `var(--col-cta)`
            },
            ':host(:not(.new)) .new-icon': { 'display': 'none', },
            ':host(.ignored):after': {
                'content': `""`,
                'position': `absolute`,
                'width': `1px`, 'height': `120%`,
                'transform': `rotate(45deg)`,
                'margin-left': `36px`,
                'margin-top': `-3px`,
                'background-color': `var(--col-warning)`
            },
            '.renderer': {
                'position': 'relative',
                'aspect-ratio': '1/1',
                'width': '52px',
                'border-radius': '3px',
                'background-color': '#1b1b1b',
                'grid-column': '1',
                'grid-row': '1 / span 2',
                'align-self': `flex-start`,

            },
            '.hidden': {
                'display': 'none',
            },
            '.toolbar': {
                'grid-column': '2 / span 1',
                'grid-row': '1',
                'align-self': `flex-start`,
                'margin-left': `4px`,
            },
            '.output': {
                'grid-column': '2 / span 1',
                'grid-row': '2',
                'margin-left': `6px`,
                'padding': `3px`,
                'padding-left': `6px`,
                //'background-color': `rgba(127,127,127,0.05)`,
                'border-radius': '3px'
            },
            '.new-icon': {
                'position': 'absolute',
                'top': `4px`,
                'left': `44px`,
                'width': `20px`,
            },
        }, super._Style());
    }

    _Render() {

        this._glyphRenderer = this.Attach(GlyphCanvasRenderer, `renderer`, this._host);
        this._glyphRenderer.options = {
            drawGuides: false,
            drawLabels: false,
            drawBBox: true,
            centered: false,
        };

        this._newIcon = new ui.manipulators.Icon(ui.El(`div`, { class: `new-icon` }, this._host));
        this._newIcon.Set(`new-small`);

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
                    htitle: `Custom assignation`,
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
            OoR = this._data.outOfRange,
            ignored = OoR;

        this._unicodeInputField.disabled = !useCustom;
        this._useCustomUniCheckbox.currentValue = useCustom;

        this._flags.Set(__outOfRange, OoR && !useCustom);
        this._flags.Set(__preserved, this._data.preserved);

        if (useCustom) {
            this._unicodeInputField.currentValue = this._data.userInput;
        } else {
            this._unicodeInputField.currentValue = ``;
        }

        if (!targetUnicode || targetUnicode.length == 0) {
            ignored = true;
            //if (OoR) { this._outputLabel.Set(`<span style='color:var(--col-warning)'>Out of range.</span>`); }
            //else { this._outputLabel.Set(`<span style='color:var(--col-warning)'>Ignored.</span>`); }
        } else {
            let unichars = [];
            targetUnicode.forEach((val) => { unichars.push(UNICODE.GetUnicodeCharacter(Number.parseInt(val, 16))); });
            this._outputLabel.Set(`<b>${unichars.join(``)}</b> (${targetUnicode.join(`<span style='opacity:0.5'>+</span>`)})`);
        }

        this._flags.Set(__ignored, ignored);
        this._flags.Set(__new, !this._data.variant && !ignored);

        if(ignored){
            this._outputLabel.Set(`<span style='color:var(--col-warning)'>Not imported.</span>`);
        }

        this._UpdatePreview();

    }

    _UpdatePreview() {

        let subFamily = this.editor._subFamily,
            contextInfos = subFamily._contextInfos,
            pathData = this._data.svgStats,
            transformedPath = SVGOPS.FitPath(
                this._data.preserved ? this._data.variant._transformSettings : this._data.transforms,
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
        this.editor._UpdatePreview(this._data);
    }

    _CleanUp() {
        this._cmd = null;
        super._CleanUp();
    }

}

module.exports = ImportListItem;
ui.Register(`mkfont-import-list-item`, ImportListItem);