'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const uilib = nkm.uilib;

const UNICODE = require(`../unicode`);
const mkfData = require(`../data`);
const mkfWidgets = require(`../widgets`);
const mkfOperations = require(`../operations`);
const mkfCmds = mkfOperations.commands;

const GlyphCanvasRenderer = require(`./glyph-canvas-renderer`);

const __nullGlyph = `null-glyph`;

const base = ui.Widget;
class GlyphMiniPreview extends base {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._flags.Add(this, __nullGlyph);
        this._glyphInfos = null;
        this.focusArea = this;
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                ...nkm.style.rules.fadeIn,
                ...nkm.style.rules.display.flex,
                'transition': `opacity 0.25s ease`,
                'padding': `3px`,
                'cursor': 'pointer',

                'aspect-ratio': '1/1',// 'var(--preview-ratio)',
                'overflow': 'hidden',
                'background-color': `rgba(var(--col-base-200-rgb), 1)`,
                'border-radius': '5px',
            },
            ':host(.null-glyph)': {
                'background-color': 'rgba(var(--col-base-100-rgb), 0.3)',
            },
            ':host(:not(.null-glyph)) .placeholder, :host(.null-glyph) .renderer': { 'display': 'none' },
            '.renderer': {
                'width': '100%',
                'aspect-ratio': '1/1',
            },
            '.placeholder': {
                'flex': '1 0 100%',
                'display': `grid`,
                'place-items': `center`,
                'text-align': `center`,
                'font-size': '2em',
                'user-select': 'none',
                'color': 'rgba(255,255,255,0.25) !important',
                'font-family': 'monospace',
                'line-height': '100%'
            }
        }, base._Style());
    }

    _Render() {

        this._glyphRenderer = this.Attach(GlyphCanvasRenderer, `renderer`);
        this._glyphRenderer.options = {
            drawGuides: false,
            drawLabels: false,
            drawBBox: false,
            centered: true,
            normalize: true
        };

        this._svgPlaceholder = new ui.manipulators.Text(ui.dom.El(`div`, { class: `box placeholder` }, this._host), false, false);

    }

    get glyphInfos() { return this._glyphInfos; }
    set glyphInfos(p_value) {
        
        

        if (!p_value) {
            this.classList.add(`disabled`);
            this._svgPlaceholder.Set(`?`, true);
            this.htitle = `UNKNOWN`;
            return;
        }else{
            this.classList.remove(`disabled`);
        }

        if (this._glyphInfos == p_value) { return; }  
        
        
        this._glyphInfos = p_value;

        let unicodeCharacter = ``;

        if (nkm.u.isNumber(this._glyphInfos)) {
            unicodeCharacter = UNICODE.GetUnicodeCharacter(this._glyphInfos);
        } else if (nkm.u.isString(this._glyphInfos)) {
            unicodeCharacter = this._glyphInfos;
        } else {
            unicodeCharacter = UNICODE.GetUnicodeCharacter(parseInt(this._glyphInfos.u, 16));
        }

        this._svgPlaceholder.Set(unicodeCharacter, true);
        this.htitle = `Go to : ${this._glyphInfos.name}`;
    }

    Activate(p_evt) {
        if (!super.Activate(p_evt)) { return false; }
        if (!this._glyphInfos) { return false; }
        nkm.datacontrols.FindEditor(this).inspectedData.Set(this._glyphInfos);
        return false;
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);

        if (this._data) {
            let isNullGlyph = this._data.glyph.isNull;
            this._flags.Set(__nullGlyph, isNullGlyph);
        }else{
            this._glyphRenderer.Set(null);
            this._flags.Set(__nullGlyph, true);
        }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._glyphRenderer.Set(p_data);
    }

    _CleanUp() {
        super._CleanUp();
    }

}

module.exports = GlyphMiniPreview;
ui.Register(`mkf-glyph-mini-preview`, GlyphMiniPreview);