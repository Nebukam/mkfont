'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const UNICODE = require(`../unicode`);

const mkfOperations = require(`../operations`);
const mkfCmds = mkfOperations.commands;
const GlyphMiniPreview = require(`./glyph-mini-preview`);

const base = ui.Widget;
class GlyphStats extends base {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._glyphInfos = null;
        this._decomposition = [];
        this._relatives = [];
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                ...nkm.style.flex.column,
                'min-height': 'auto',
                //'padding': '20px',
                'padding-bottom': '5px',
                'margin-bottom': '5px',
                //'border-bottom': '1px solid rgba(0,0,0,0.25)',
            },
            '.long-name': {
                'padding-bottom': '15px',
                'margin-bottom': '5px',
                'border-bottom': '1px solid rgba(127, 127, 127, 0.1)',
                'height': '2.2em',
                'word-break': 'break-all',
            },
            '.tagbar': {
                'max-height': '16px',
                'margin-left': '4px',
                'margin-right': '4px'
            },
            '.toolbar': {

            },
            '.hdr': {
                'text-transform': `uppercase`,
                //'opacity': `0.5`,
                'margin': `5px`,
            },
            '.shortcuts': {
                ...nkm.style.flexItem.fill,
                'display': 'grid',
                'grid-template-columns': 'repeat(4, 1fr)',
                'grid-gap': '10px'
            },
            '.shortcut-item': {
                ...nkm.style.flexItem.fill,
                'aspect-ratio': `1/1`
            }
        }, base._Style());
    }

    _Render() {

        super._Render();

        this._refTitle = new ui.manipulators.Text(ui.dom.El("div", { class: "hdr label font-small" }, this), true);
        this._refTitle.Set(null);

        this._selectAllUsers = this.Attach(nkm.uilib.buttons.Button, `btn`, this);
        this._selectAllUsers.options = {
            icon: `shortcut`, label: `Select all`, variant: ui.FLAGS.FRAME,
            trigger: {
                fn: () => {
                    let list = [];
                    this._data.layerUsers.ForEach(user => {
                        if (!user._variant || !user._variant.glyph) { return; }
                        list.push(user._variant.glyph.unicodeInfos);
                    });
                    this._editor.inspectedData.SetList(list);
                }
            }
        }

        this._refText = new ui.manipulators.Text(ui.dom.El("span", { class: "label" }, this), false);
        this._refText.Set(null);

        this._decompTitle = new ui.manipulators.Text(ui.dom.El("div", { class: "hdr label font-small" }, this), true);
        this._decompTitle.Set(null);

        this._decompCtnr = ui.dom.El("div", { class: `shortcuts decomp` }, this);

        this._relTitle = new ui.manipulators.Text(ui.dom.El("div", { class: "hdr label font-small" }, this), true);
        this._relTitle.Set(null);

        this._relativesCtnr = ui.dom.El("div", { class: `shortcuts relatives` }, this);

    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        if (!this._data) { this._DisplayNull(); }
    }

    set context(p_value) { this._family = p_value; }
    set editor(p_value) { this._editor = p_value; }

    set glyphInfos(p_value) {
        if (this._glyphInfos == p_value) { return; }
        this._glyphInfos = p_value;
        this._RebuildDecomposition();
        this._RebuildRelatives();
    }

    _RebuildDecomposition() {

        this._decomposition.forEach(item => { item.Release(); });
        this._decomposition.length = 0;

        if (!this._family || !this._glyphInfos) { return; }
        if (!this._glyphInfos.comp) {
            this._decompTitle.Set(null);
            return;
        }

        this._decompTitle.Set(`Decomposition (${this._glyphInfos.comp.length})`);
        this._glyphInfos.comp.forEach(decomp => {
            let
                decompItem = this.Attach(GlyphMiniPreview, `shortcut-item`, this._decompCtnr),
                unicodeInfos = UNICODE.GetInfos(decomp, false),
                glyph = this._family.GetGlyph(unicodeInfos.u);

            decompItem.glyphInfos = unicodeInfos;
            decompItem.data = glyph.activeVariant;

            this._decomposition.push(decompItem);
        });


    }

    _RebuildRelatives() {

        this._relatives.forEach(item => { item.Release(); });
        this._relatives.length = 0;

        if (!this._family || !this._glyphInfos) { return; }
        if (!this._glyphInfos.relatives) {
            this._relTitle.Set(null);
            return;
        }

        let count = 0;
        this._glyphInfos.relatives.forEach(decomp => {

            if (this._glyphInfos.comp && this._glyphInfos.comp.includes(decomp)) { return; }
            count++;
            let
                relItem = this.Attach(GlyphMiniPreview, `shortcut-item`, this._relativesCtnr),
                unicodeInfos = UNICODE.GetInfos(decomp, false),
                glyph = this._family.GetGlyph(unicodeInfos.u);

            relItem.glyphInfos = unicodeInfos;
            relItem.data = glyph.activeVariant;

            this._relatives.push(relItem);
        });

        this._relTitle.Set(count > 0 ? `Relatives (${count})` : null);


    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        let users = p_data.layerUsers;
        if (users.count == 0) {
            this._refTitle.Set(null);
            this._selectAllUsers.visible = false;
        } else {
            this._refTitle.Set(`Used as component  ×${users.count}`);
            this._selectAllUsers.visible = true;
        }
    }

    Multi(p_title, p_uni) {

        this._multi = p_uni;

        this._title.Set(p_title);
        this._blockTag.visible = false; this._blockTag.htitle = null;
        this._catTag.visible = false;
        this._hexTag.label = `${p_uni}`;
        this._catTag.textColor = `var(--col-cta)`;
    }

}

module.exports = GlyphStats;
ui.Register(`mkf-glyph-stats`, GlyphStats);