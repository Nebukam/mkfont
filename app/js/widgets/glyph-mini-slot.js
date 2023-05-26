'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const UNICODE = require(`../unicode`);
const SIGNAL = require(`../signal`);

const mkfData = require(`../data`);

const GlyphCanvasRenderer = require(`./glyph-canvas-renderer`);

const __rscBound = `rsc-bound`;
const __ligature = `ligature`;

const base = nkm.datacontrols.ControlWidget;
class GlyphMiniSlot extends base {
    constructor() { super(); }

    static __usePaintCallback = true;
    static __defaultSelectOnActivation = true;

    _Init() {

        super._Init();

        this._Bind(this._UpdateGlyphPreview);

        this._extensions.Remove(this._extDrag);
        this._notifiesSelectionStack = true;

        this._glyhpVariant = null;
        this._glyphInfos = null;

        this._flags.Add(this, mkfData.IDS.OUT_OF_BOUNDS, mkfData.IDS.EMPTY, mkfData.IDS.DO_EXPORT, __rscBound, __ligature);

        this._dataObserver.Hook(SIGNAL.VARIANT_UPDATED, this._UpdateGlyphPreview, this);

    }

    _PostInit() {
        super._PostInit();
        this.focusArea = this;
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                ...nkm.style.rules.fadeIn,
                ...nkm.style.rules.pos.rel,
                ...nkm.style.flex.column.nowrap,
                ...nkm.style.flex.align.center.all,
                'transition': 'opacity 0.15s, transform 0.05s, box-shadow 0.05s',
                'box-shadow': `none`,
                'transform': 'scale(1)',
                'box-sizing': 'border-box',
                'padding': '2px',
                'border-radius': '3px',
                'background-color': '#161616',
                'overflow': 'clip',
                'border':`1px solid rgba(0,0,0,0)`
            },
            ':host(:hover)': {
                'box-shadow': `0 12px 20px -10px #131313`,
                'z-index': 1,
                'transform': 'scale(1.1)',
            },
            ':host(.selected)': {
                'background-color': '#353535 !important',
                'border-color':`var(--col-active)`
            },
            ':host(.exists)': {
                'background-color': '#1e1e1e'
            },
            '.cat-hint': {
                ...nkm.style.rules.pos.abs,
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
                ...nkm.style.rules.pos.rel,
                ...nkm.style.flex.column.nowrap,
                'border-radius': 'inherit',
                //'aspect-ratio': 'var(--preview-ratio)',
                ...nkm.style.flexItem.grow,
                'min-height': 'var(--preview-height)',
                'min-width': 'var(--preview-width)',
                'width': '100%',
                'justify-content': 'center',
                'overflow-y': 'clip'
            },
            '.box': {
                ...nkm.style.rules.absolute.fill,
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
                ...nkm.style.rules.absolute.center,
                'width': '50%'
            },
            ':host(.out-of-bounds) .oob': {
                'display': 'block !important'
            },
            ':host(.out-of-bounds)': {
                'background-color': 'rgba(var(--col-error-rgb), 0.5) !important'
            },
            ':host(.exists:not(.do-export)) .preview:before': {
                'content': `""`,
                ...nkm.style.rules.pos.abs,
                'top': '50%', 'left': '50%',
                'transform': 'translate(-50%, -50%) rotate(45deg)',
                'width': `1px`, 'height': `120%`,
                'background-color': `var(--col-error)`
            },
            ':host(.rsc-bound)': {

            }
        }, base._Style());
    }

    _Render() {

        super._Render();

        this._previewBox = ui.dom.El(`div`, { class: `preview` }, this._host);

        this._glyphPlaceholder = new ui.manipulators.Text(ui.dom.El(`div`, { class: `box placeholder` }, this._previewBox), false, false);
        this._glyphRenderer = this.Attach(GlyphCanvasRenderer, `box renderer`, this._previewBox);

    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        this._UpdateGlyph();
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);

        let unicodeCharacter = p_data.char;
        this._flags.Set(__ligature, p_data.ligature);
        this._glyphPlaceholder.Set(unicodeCharacter, true);
        this.htitle = p_data.name;

    }

    _UpdateGlyph() {

        let variant = null;
        if (this._data && this._context) {
            variant = this._context.GetGlyph(this._data.u).activeVariant;
        }

        if (this._glyhpVariant == variant) { return; }

        if (this._glyhpVariant) {
            this._glyhpVariant.Unwatch(nkm.com.SIGNAL.UPDATED, this._UpdateGlyphPreview, this);
        }

        this._glyhpVariant = variant;

        if (this._glyhpVariant) {
            if (!this._glyhpVariant.glyph.isNull) {
                this._glyhpVariant.Watch(nkm.com.SIGNAL.UPDATED, this._UpdateGlyphPreview, this);
            }
            this._UpdateGlyphPreview();
        }

    }

    _UpdateGlyphPreview() {

        if (!this._glyhpVariant || this._glyhpVariant.glyph.isNull) {
            this._glyphRenderer.Set(null);
            this._glyphPlaceholder._element.style.removeProperty(`display`);
            this.classList.remove(`exists`);
            return;
        }

        if (this._glyphRenderer.Set(this._glyhpVariant)) {
            this._glyphPlaceholder._element.style.display = `none`;
            this.classList.add(`exists`);
            this._flags.Set(mkfData.IDS.OUT_OF_BOUNDS, this._glyhpVariant.Get(mkfData.IDS.OUT_OF_BOUNDS));
            this._flags.Set(mkfData.IDS.EMPTY, this._glyhpVariant.Get(mkfData.IDS.EMPTY));
            this._flags.Set(mkfData.IDS.DO_EXPORT, this._glyhpVariant.Get(mkfData.IDS.DO_EXPORT));
        } else {
            delete this._glyphPlaceholder._element.style.display;
            this._flags.Set(mkfData.IDS.OUT_OF_BOUNDS, false);
            this._flags.Set(mkfData.IDS.EMPTY, false);
            this._flags.Set(mkfData.IDS.DO_EXPORT, false);
            this.classList.remove(`exists`);
        }

    }

    _CleanUp() {
        this._flags.Set(mkfData.IDS.OUT_OF_BOUNDS, false);
        this._flags.Set(mkfData.IDS.EMPTY, false);
        this._glyphRenderer.Clear();
        super._CleanUp();
    }

}

module.exports = GlyphMiniSlot;
ui.Register(`mkf-glyph-mini-slot`, GlyphMiniSlot);