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
const __previewCount = 4;

const base = ui.Widget;
class GlyphPreviewGroup extends base {
    constructor() { super(); }

    static __updateDataOnSameSet = true;

    _Init() {
        super._Init();
        this._previews = [];
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                '@': ['fade-in'],
                'position': 'relative',
                'grid-gap': `10px`,
                'display': 'grid',
                'grid-template-columns': 'auto auto',
                'grid-template-rows': 'auto auto',
                'justify-content': `center`,
                'align-content': `space-between`, //center
            },
            '.box': {
                'position': 'relative',
                'display': 'flex',
                'aspect-ratio': '1/1',// 'var(--preview-ratio)',
                'flex': '1 1 auto',
                'width': '100%',
                'overflow': 'hidden',
                'background-color': 'rgba(0,0,0,0.5)',
                'border-radius': '5px',
            },
            '.tag': {
                '@': [`absolute-bottom-right`],
                'margin': `10px`
            },
        }, base._Style());
    }

    _Render() {

        for (let i = 0; i < __previewCount; i++) {
            let gr = this.Attach(GlyphCanvasRenderer, `box`);
            this._previews.push(gr);
            gr.options = {
                drawGuides: true,
                drawBBox: true,
                centered: false,
                normalize: true
            }
        }

        this._counter = this.Attach(nkm.uilib.widgets.Tag, `tag`);
        this._counter.label = `+50`;
        this._counter.bgColor = `var(--col-cta-dark)`;

    }

    set glyphLayer(p_value) { }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        if (!this._data) { this._counter.visible = false; }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);

        let list = p_data;

        if (!list) {
            this._previews.forEach(preview => { preview.visible = false; });
            return;
        }

        let count = list.length;

        for (let i = 0; i < __previewCount; i++) {
            let
                preview = this._previews[i],
                okay = i <= count - 1;

            if (okay) {
                preview.visible = true;
                preview.Set(list[count - (i + 1)]);
            } else {
                preview.visible = false;
            }
        }

        if (count > __previewCount) {
            this._counter.visible = true;
            this._counter.label = `+${count - __previewCount}`;
        } else {
            this._counter.visible = false;
        }

    }

    _CleanUp() {
        this.glyphLayer = null;
        super._CleanUp();
    }

}

module.exports = GlyphPreviewGroup;
ui.Register(`mkf-glyph-preview-group`, GlyphPreviewGroup);