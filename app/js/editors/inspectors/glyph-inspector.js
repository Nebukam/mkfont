'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;

const MiniHeader = nkm.datacontrols.widgets.MiniHeader;
const ValueControl = nkm.datacontrols.widgets.ValueControl;

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

const LOC = require(`../../locales`);
const SIGNAL = require(`../../signal`);

const GlyphIItem = require(`./glyph-iitem`);

const base = nkm.datacontrols.InspectorView;
class GlyphInspector extends base {
    constructor() { super(); }

    static __controls = [
        //{ cl: MiniHeader, options: { label: `Export` } },
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

        this._builder.defaultControlClass = ValueControl;
        this._builder.defaultCSS = `control`;
        this._builder.preProcessDataFn = { fn: this._GetGlyph, thisArg: this };

        this._delayedStatsUpdate = nkm.com.DelayedCall(this._Bind(this._RefreshStats));

        this._contextObserver
            .Hook(SIGNAL.GLYPH_ADDED, this._OnGlyphAdded, this)
            .Hook(SIGNAL.GLYPH_REMOVED, this._OnGlyphRemoved, this);

    }

    static _Style() {
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
            '.control': {
                'margin-bottom': '5px',
            },
            '.drawer': {
                'flex': '0 0 auto',
                'padding': `10px`,
                'background-color': `rgba(19, 19, 19, 0.25)`,
                'border-radius': '4px',
            }
        }, base._Style());
    }

    _Render() {

        this._glyphIdentity = this.Attach(mkfWidgets.GlyphIdentity, `identity`, this._host);
        //this._body = ui.El(`div`, { class: `body` }, this._host);
        this._variantCtrl = this.Attach(GlyphIItem, `variant`, this._host);
        this.forwardContext.To(this._variantCtrl);

        super._Render();

        // Stats

        let foldout = this.Attach(nkm.uilib.widgets.Foldout, `item drawer`, this._host);
        foldout.options = { title: LOC.labelDetails, icon: `placement-center`, prefId: `glyph-infos`, expanded: true };

        this._glyphStats = this.Attach(mkfWidgets.GlyphStats, `foldout-item`, foldout);
        this.forwardContext.To(this._glyphStats);
        this.forwardEditor.To(this._glyphStats);

    }

    _OnDataChanged(p_oldData) {

        super._OnDataChanged(p_oldData);

        if (!this._data) {
            this._variantCtrl.data = null;
        } else {
            this._glyphIdentity.data = this._data;

            let glyph = this._GetGlyph(this._data);

            if (glyph) {

                if (glyph.isNull) {
                    glyph.unicodeInfos = this._data;
                    this._variantCtrl.data = null; // Ensure refresh
                }

                this._variantCtrl.glyphInfos = this._data;
                this._variantCtrl.data = glyph.activeVariant;

                this._glyphStats.data = glyph.activeVariant;

            } else {
                
                this._variantCtrl.glyphInfos = null;
                this._variantCtrl.data = null;

                this._glyphStats.data = null;

            }

        }

        this._glyphStats.glyphInfos = this._data;

    }

    _GetGlyph(p_unicodeInfos) {
        if (!this._context || !p_unicodeInfos) { return null; }
        return this._context.GetGlyph(p_unicodeInfos.u);
    }

    _GetActiveVariant() {
        if (!this._context || !this._data) { return null; }
        return this._context.GetGlyph(this._data.u).activeVariant;
    }

    _OnGlyphAdded(p_family, p_glyph) {
        if (p_glyph.unicodeInfos == this._data) {
            this._variantCtrl.data = this._GetActiveVariant();
        }
        this._delayedStatsUpdate.Bump();
    }

    _OnGlyphRemoved(p_family, p_glyph) {
        if (p_glyph.unicodeInfos == this._data) {
            this._variantCtrl.data = this._GetActiveVariant();
        }
        this._delayedStatsUpdate.Bump();
    }

    _RefreshStats() {
        this._glyphStats.glyphInfos = null;
        this._glyphStats.glyphInfos = this._data;
    }

}

module.exports = GlyphInspector;