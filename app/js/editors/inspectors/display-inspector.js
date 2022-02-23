const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

class DisplayInspector extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    static __controls = [
        { options: { propertyId: mkfData.IDS.COLOR_PREVIEW } },
    ];

    _Init() {
        super._Init();
        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'flex': '0 0 auto',
                'min-width': '300px'
            },
            '.list': {
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
            }
        }, super._Style());
    }

    _Render() {

        this._body = ui.dom.El(`div`, { class: `list` }, this._host);
        this._builder.host = this._body;

        super._Render();

        this._controls = ui.dom.El("div", { class: 'controls' }, this._body);

        this._sizeSlider = this.Add(uilib.inputs.SliderOnly, `control slider`, this._controls);
        this._sizeSlider.options = {
            label: `Preview size`,
            min: 50, max: 250, step: 1, currentValue: 50,
            size: ui.FLAGS.SIZE_XXS,
            onSubmit: { fn: this._Bind(this._OnPreviewSizeChanged) }
        };

        this._LRatioSlider = this.Add(uilib.inputs.SliderOnly, `control slider`, this._controls);
        this._LRatioSlider.options = {
            label: `L Ratio`,
            min: 1, max: 3, step: 1, currentValue: 1,
            size: ui.FLAGS.SIZE_XXS,
            onSubmit: { fn: this._Bind(this._OnRatioSizeChanged) }
        };
        this._RRatioSlider = this.Add(uilib.inputs.SliderOnly, `control slider`, this._controls);
        this._RRatioSlider.options = {
            label: `R Ratio`,
            min: 1, max: 3, step: 1, currentValue: 1,
            size: ui.FLAGS.SIZE_XXS,
            onSubmit: { fn: this._Bind(this._OnRatioSizeChanged) }
        };

        // Preview align mode (left/center/right)

        // ...

    }

    _OnEditorChanged(p_oldEditor) {
        if (!this._editor) { return; }
        this._OnPreviewSizeChanged();
        this._OnRatioSizeChanged();
    }

    _OnPreviewSizeChanged() {
        this._editor.style.setProperty(`--preview-size`, `${this._sizeSlider._handler.currentValue}px`);
    }

    _OnRatioSizeChanged() {
        this._editor.style.setProperty(`--preview-ratio`, `${this._LRatioSlider._handler.currentValue}/${this._RRatioSlider._handler.currentValue}`);
    }

    //#region Family properties

    _PreprocessData(p_data) {
        if (!nkm.utils.isInstanceOf(p_data, mkfData.Family)) { return null; }
        return p_data;
    }

    //#endregion


}

module.exports = DisplayInspector;
ui.Register(`mkf-display-explorer`, DisplayInspector);