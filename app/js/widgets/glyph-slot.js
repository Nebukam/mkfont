const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const UNICODE = require(`../unicode`);
const mkfData = require(`../data`);
const GlyphRenderer = require(`./glyph-renderer`);
const GlyphCanvasRenderer = require(`./glyph-canvas-renderer`);

class GlyphSlot extends nkm.datacontrols.ControlWidget {
    constructor() { super(); }

    static __usePaintCallback = true;

    _Init() {

        this.default_SelectOnActivation = true;

        super._Init();

        this._extensions.Remove(this._extDrag);
        this._notifiesSelectionStack = true;

        this._subFamily = null;
        this._glyphInfos = null;

    }

    _PostInit() {
        super._PostInit();
        this.focusArea = this;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'transition': 'opacity 0.3s',
                'position': 'relative',
                //'min-height': 'var(--preview-size)',
                //'border':'1px solid gray',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                //'margin-bottom': '4px',
                'box-sizing': 'border-box',
                'padding': '10px',
                'border-radius': '5px',
                'background-color': 'rgba(0,0,0,0.25)',
                'align-items': 'center',
                'overflow': 'clip',
                'opacity': '1'
            },
            ':host(.unpainted)': {
                'opacity': '0'
            },
            ':host(.selected)': {
                'background-color': 'rgba(127,127,127,0.25)'
            },
            ':host(.unpainted) .box': { 'display': 'none' },
            '.preview': {
                'position': 'relative',
                //'aspect-ratio': 'var(--preview-ratio)',
                'flex': '1 0 auto',
                'min-height': 'var(--preview-height)',
                'min-width': 'var(--preview-width)',
                'width': '100%',
                'display': 'flex',
                'flex-flow': 'row nowrap',
                'justify-content': 'center',
                'overflow-y': 'clip'
            },
            '.box': {
                'width': '100%',
                'height': '100%',
                //'aspect-ratio': 'var(--preview-ratio)',
                'position': 'absolute',
            },
            '.label': {
                'margin-top': '10px',
                'text-align': `center`,
                'padding': '5px'
            },
            'code': {
                'margin': '0',
                'font-size': 'large',
                'user-select': 'text'
            },
            '.placeholder': {
                'display': `grid`,
                'place-items': `center`,
                'text-align': `center`,
                'font-size': 'calc(var(--preview-size) * 0.7)',
                'user-select': 'none',
                'color': 'rgba(255,255,255,0.05)',
                'font-family': 'monospace',
                'line-height': '100%'
            },
        }, super._Style());
    }

    _Render() {

        super._Render();

        this._previewBox = ui.dom.El(`div`, { class: `preview` }, this._host);

        this._glyphPlaceholder = new ui.manipulators.Text(ui.dom.El(`div`, { class: `box placeholder` }, this._previewBox), false, false);
        this._glyphRender = this.Add(GlyphCanvasRenderer, `box renderer`, this._previewBox);

        this._label = new ui.manipulators.Text(ui.dom.El(`div`, { class: `item label` }, this._host), false, false);

    }

    get subFamily() { return this._subFamily; }
    set subFamily(p_value) {
        if (this._subFamily == p_value) { return; }
        this._subFamily = p_value;
    }

    get glyphInfos() { return this._glyphInfos; }
    set glyphInfos(p_value) {
        if (this._glyphInfos == p_value) { return; }

        this._glyphInfos = p_value;

        let unicodeCharacter = ``;
        let glyphData = null;

        if (nkm.utils.isNumber(this._glyphInfos)) {
            unicodeCharacter = UNICODE.GetUnicodeCharacter(this._glyphInfos);
        } else {
            unicodeCharacter = UNICODE.GetUnicodeCharacter(parseInt(this._glyphInfos.u, 16));
        }

        this._label.Set(`<code>${unicodeCharacter}</code>`);
        this._glyphPlaceholder.Set(unicodeCharacter);

        this.data = glyphData;

    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._UpdateGlyphPreview();
    }

    _UpdateGlyphPreview() {

        if (!this._data) {
            this._glyphRender.Set(null);
            delete this._glyphPlaceholder._element.style.display;
            return;
        }

        let glyphVariant = glyphData.GetVariant(this._subFamily);

        if (this._glyphRender.Set(glyphVariant)) {
            this._glyphPlaceholder._element.style.display = `none`;
        } else {
            delete this._glyphPlaceholder._element.style.display;
        }
    }

    _ToClipboard() {
        navigator.clipboard.writeText(this._data._options.glyph);
    }

    _Cleanup() {
        super._Cleanup();
    }

}

module.exports = GlyphSlot;
ui.Register(`mkfont-glyph-slot`, GlyphSlot);