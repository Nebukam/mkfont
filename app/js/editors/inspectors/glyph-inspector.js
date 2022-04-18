'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const operations = require(`../../operations/index`);

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

const SIGNAL = require(`../../signal`);
const UNICODE = require(`../../unicode`);

const GlyphIItem = require(`./glyph-iitem`);

class GlyphInspector extends nkm.datacontrols.InspectorView {
    constructor() { super(); }

    static __controls = [
        //{ cl: mkfWidgets.ControlHeader, options: { label: `Export` } },
        //{ options: { propertyId: mkfData.IDS.GLYPH_NAME } },//, css:'separator' 
    ];

    _Init() {
        super._Init();
        this._ctrls = [];
        this._idList = [
            mkfData.IDS.GLYPH_NAME,
            mkfData.IDS.WIDTH,
            mkfData.IDS.HEIGHT
        ];

        this._variantCtrl = null;
        this._variantNoneCtrl = null;

        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;
        this._builder.preProcessDataFn = { fn: this._GetGlyph, thisArg: this };

        this._contextObserver
            .Hook(SIGNAL.GLYPH_ADDED, this._OnGlyphAdded, this)
            .Hook(SIGNAL.GLYPH_REMOVED, this._OnGlyphRemoved, this);

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'padding': '10px',
                'display': 'flex',
                'flex-flow': 'column nowrap'
            },
            '.variant': {
                'flex': '0 0 auto',
                'margin-bottom': '3px'
            },
            '.identity': {
                'margin-bottom': '0',
            },
            '.body': {

            },
            '.settings': {
                'flex': '1 0 auto',
                'margin-bottom': '10px'
            },
            '.control': {
                'margin-bottom': '5px',
            }
        }, super._Style());
    }

    _Render() {

        this._glyphIdentity = this.Attach(mkfWidgets.GlyphIdentity, `identity`, this._host);
        //this._body = ui.El(`div`, { class: `body` }, this._host);
        this._variantCtrl = this.Attach(GlyphIItem, `variant`, this._host);
        this.forwardContext.To(this._variantCtrl);

        this._builder.host = ui.El(`div`, { class: `settings` }, this._host);

        super._Render();

    }

    _OnDataChanged(p_oldData) {

        super._OnDataChanged(p_oldData);

        if (!this._data) {
            this._variantCtrl.data = null;
        } else {
            this._glyphIdentity.data = this._data;
            let glyph = this._GetGlyph(this._data);

            if (glyph.isNull) {
                glyph.unicodeInfos = this._data;
                this._builder.host.style.setProperty(`display`, `none`);
                this._variantCtrl.data = null; // Ensure refresh
            } else {
                this._builder.host.style.removeProperty(`display`);
            }

            this._variantCtrl.glyphInfos = this._data;
            this._variantCtrl.data = glyph.GetVariant(this._context.selectedSubFamily);

        }
    }

    _GetGlyph(p_unicodeInfos) {
        if (!this._context || !p_unicodeInfos) { return null; }
        return this._context.GetGlyph(p_unicodeInfos.u);
    }

    _GetActiveVariant() {
        if (!this._context || !this._data) { return null; }
        return this._context.GetGlyph(this._data.u).GetVariant(this._context.selectedSubFamily);
    }

    _OnGlyphAdded(p_family, p_glyph) {
        if (p_glyph.unicodeInfos == this._data) {
            this._variantCtrl.data = this._GetActiveVariant();
        }
    }

    _OnGlyphRemoved(p_family, p_glyph) {
        if (p_glyph.unicodeInfos == this._data) {
            this._variantCtrl.data = this._GetActiveVariant();
        }
    }

}

module.exports = GlyphInspector;