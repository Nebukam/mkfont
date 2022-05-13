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
class GlyphPreview extends base {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._flags.Add(this, __nullGlyph);
        this._glyphInfos = null;
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                '@': ['fade-in'],
                'transition': `opacity 0.25s ease`,
                'padding': `3px`,

                'position': 'relative',
                'display': 'flex',
                'aspect-ratio': '1/1',// 'var(--preview-ratio)',
                'width': '320px',
                'overflow': 'hidden',
                'background-color': 'rgba(0,0,0,0.5)',
                'border-radius': '5px',
            },
            ':host(.floating)':{
                'margin': `5px`,
                'border-radius': '3px',
            },
            ':host(:not(.null-glyph)) .placeholder, :host(.null-glyph) .renderer': { 'display': 'none' },
            '.renderer': {
                'position': 'relative',
                'width': '100%',
                'aspect-ratio': '1/1',
            },
            '.placeholder': {
                'flex': '1 0 100%',
                'position': 'relative',
                'display': `grid`,
                'place-items': `center`,
                'text-align': `center`,
                'font-size': '10em',
                'user-select': 'none',
                'color': 'rgba(255,255,255,0.25)',
                'font-family': 'monospace',
                'line-height': '100%'
            },
            '.infoTag': {
                '@': ['absolute-center']
            },
            '.emptyTag': {
                '@': ['absolute-bottom'],
                'margin': `5px`
            }
        }, base._Style());
    }

    _Render() {

        this._glyphRenderer = this.Attach(GlyphCanvasRenderer, `renderer`);
        this._glyphRenderer.options = {
            drawGuides: true,
            drawLabels: true,
            drawBBox: true,
            centered: false,
            normalize: true
        };

        this._svgPlaceholder = new ui.manipulators.Text(ui.dom.El(`div`, { class: `box placeholder` }, this._host), false, false);

        this._oobTag = this.Attach(uilib.widgets.Tag, `infoTag`);
        this._oobTag.options = {
            label: `out of bounds`,
            flavor: nkm.com.FLAGS.ERROR,
            htitle: `The glyph is out of bounds and won't be added to the font.\nKeep it within -16000..16000`
        };
        this._oobTag.visible = false;

        this._emptyTag = this.Attach(uilib.widgets.Tag, `emptyTag`);
        this._emptyTag.options = {
            label: `empty`,
            bgColor: nkm.style.Get(`--col-warning-dark`),
            htitle: `This glyph is void.`
        };
        this._emptyTag.visible = false;

    }

    set glyphLayer(p_value) { this._glyphRenderer.layer = p_value; }

    get glyphInfos() { return this._glyphInfos; }
    set glyphInfos(p_value) {
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
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);

        if (this._data) {
            let isNullGlyph = this._data.glyph.isNull;
            this._flags.Set(__nullGlyph, isNullGlyph);
        }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._glyphRenderer.Set(p_data);
        this._oobTag.visible = p_data.Get(mkfData.IDS.OUT_OF_BOUNDS);
        this._emptyTag.visible = p_data.Get(mkfData.IDS.EMPTY);
    }

    _CleanUp(){
        this.glyphLayer = null;
        this.classList.remove(`floating`);
        super._CleanUp();
    }

}

module.exports = GlyphPreview;
ui.Register(`mkf-glyph-preview`, GlyphPreview);