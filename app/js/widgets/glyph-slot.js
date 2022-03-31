const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const UNICODE = require(`../unicode`);
const SIGNAL = require(`../signal`);

const mkfData = require(`../data`);

const GlyphCanvasRenderer = require(`./glyph-canvas-renderer`);

class GlyphSlot extends nkm.datacontrols.ControlWidget {
    constructor() { super(); }

    static __usePaintCallback = true;
    static __defaultSelectOnActivation = true;

    _Init() {

        super._Init();

        this._Bind(this._UpdateGlyphPreview);

        this._extensions.Remove(this._extDrag);
        this._notifiesSelectionStack = true;

        this._subFamily = null;
        this._glyphInfos = null;

        this._flags.Add(this, mkfData.IDS.OUT_OF_BOUNDS);

        this._dataObserver.Hook(SIGNAL.VARIANT_UPDATED, this._UpdateGlyphPreview, this);

    }

    _PostInit() {
        super._PostInit();
        this.focusArea = this;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                '@': ['fade-in'],
                'transition': 'opacity 0.15s, transform 0.05s, box-shadow 0.05s',
                'box-shadow': `none`,
                'transform': 'scale(1)',
                'position': 'relative',
                '--col-cat': 'var(--col-active)',
                //'min-height': 'var(--preview-size)',
                //'border':'1px solid gray',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                //'margin-bottom': '4px',
                'box-sizing': 'border-box',
                'padding': '10px',
                'border-radius': '5px',
                'background-color': '#161616',
                'align-items': 'center',
                'overflow': 'clip',
            },
            ':host(:hover)': {
                'box-shadow': `0 12px 20px -10px #131313`,
                'z-index': 1,
                'transform': 'scale(1.1)',
            },
            ':host(.selected)': {
                'background-color': '#353535 !important'
            },
            ':host(.exists)': {
                'background-color': '#1e1e1e'
            },
            '.cat-hint': {
                'position': 'absolute',
                'width': '4px',
                'height': '4px',
                'border-radius': '10px',
                'background-color': 'var(--col-cat)',
                'bottom': '10px',
                'left': 'calc(50% - 2px)',
                'opacity': '0.5'
            },
            ':host(.unpainted) .box': { 'display': 'none' },
            '.preview': {
                'position': 'relative',
                'border-radius': 'inherit',
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
            'code': {
                'margin': '0',
                'text-align': `center`,
                'padding': '5px',
                'font-size': 'large',
                'user-select': 'text'
            },
            '.placeholder': {
                'display': `grid`,
                'place-items': `center`,
                'text-align': `center`,
                'font-size': 'calc(var(--preview-size) * 0.5)',
                'user-select': 'none',
                'color': 'rgba(255,255,255,0.25)',
                'font-family': 'monospace',
                'line-height': '100%'
            },
            '.oob': {
                'display': 'none',
                '@': ['absolute-center'],
                'width': '50%'
            },
            ':host(.outofbounds) .oob': {
                'display': 'block !important'
            },
            ':host(.outofbounds)': {
                'background-color': 'rgba(var(--col-error-rgb), 0.5) !important'
            }
        }, super._Style());
    }

    _Render() {

        super._Render();

        this._previewBox = ui.dom.El(`div`, { class: `preview` }, this._host);

        this._glyphPlaceholder = new ui.manipulators.Text(ui.dom.El(`div`, { class: `box placeholder` }, this._previewBox), false, false);
        this._glyphRenderer = this.Attach(GlyphCanvasRenderer, `box renderer`, this._previewBox);

        this._label = new ui.manipulators.Text(ui.dom.El(`code`, { class: `item` }, this._host), false, false);
        //this._oobIcon = new ui.manipulators.Icon(ui.dom.El(`div`, {class:`oob` }, this._previewBox), false, false);
        //this._oobIcon.Set(`remove`);

        ui.dom.El(`div`, { class: `cat-hint` }, this._host);

    }

    get subFamily() { return this._subFamily; }
    set subFamily(p_value) {
        if (this._subFamily == p_value) { return; }
        this._subFamily = p_value;
    }

    get glyphInfos() { return this._glyphInfos; }
    set glyphInfos(p_value) {
        //if (this._glyphInfos == p_value) { return; }

        this._glyphInfos = p_value;

        let unicodeCharacter = p_value.char;
        let glyphData = this._subFamily.family.TryGetGlyph(p_value),
            colCat = null;

        if(!unicodeCharacter){
            unicodeCharacter = ` `;
            colCat = `var(--col-error)`;
        }else if (unicodeCharacter.length > 1) {
            colCat = `var(--col-ligature)`;
        }

        if (`cat` in p_value) { colCat = `var(--col-${p_value.cat.col})`; }

        if (colCat) { this.style.setProperty(`--col-cat`, colCat); }
        else { this.style.removeProperty(`--col-cat`); }

        this._label.Set(`${unicodeCharacter}`, true);
        this._glyphPlaceholder.Set(unicodeCharacter, true);

        this.data = glyphData;

    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._UpdateGlyphPreview();
    }

    _UpdateGlyphPreview() {

        if (!this._data || this._data.isNull) {
            this._glyphRenderer.Set(null);
            this._glyphPlaceholder._element.style.removeProperty(`display`);
            this.classList.remove(`exists`);
            return;
        }

        let glyphVariant = this._data.GetVariant(this._subFamily);

        if (this._glyphRenderer.Set(glyphVariant)) {
            this._glyphPlaceholder._element.style.display = `none`;
            this.classList.add(`exists`);
            this._flags.Set(mkfData.IDS.OUT_OF_BOUNDS, glyphVariant.Get(mkfData.IDS.OUT_OF_BOUNDS));
        } else {
            delete this._glyphPlaceholder._element.style.display;
            this._flags.Set(mkfData.IDS.OUT_OF_BOUNDS, false);
            this.classList.remove(`exists`);
        }
    }

    _ToClipboard() {
        navigator.clipboard.writeText(this._data._options.glyph);
    }

    _Cleanup() {
        this._flags.Set(mkfData.IDS.OUT_OF_BOUNDS, false);
        super._Cleanup();
    }

}

module.exports = GlyphSlot;
ui.Register(`mkfont-glyph-slot`, GlyphSlot);