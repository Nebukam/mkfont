const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

class GlyphExplorer extends nkm.uiworkspace.Explorer {
    constructor() { super(); }

    _Init() {

        super._Init();

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'flex': '0 0 auto',
                'min-width': '250px'
            }
        }, super._Style());
    }

    _Render() {

        super._Render();

        this._controls = ui.dom.El("div", { class: 'controls' }, this._body);

        this._sizeSlider = this.Add(uilib.inputs.SliderOnly, `control slider`, this._controls);
        this._sizeSlider.options = {
            label:`preview size`,
            min: 50, max: 500, step: 1,
            currentValue: 100,
            size: ui.FLAGS.SIZE_XXS,
            onSubmit: { fn: this._Bind(this._OnPreviewSizeChanged) }
        };

    }

    set editor(p_editor) {
        this._editor = p_editor;
        if (!p_editor) { return; }
        this._OnPreviewSizeChanged();
    }

    _OnPreviewSizeChanged() {
        this._editor.style.setProperty(`--preview-size`, `${this._sizeSlider._handler.currentValue}px`);
    }



}

module.exports = GlyphExplorer;
ui.Register(`mkf-glyph-explorer`, GlyphExplorer);