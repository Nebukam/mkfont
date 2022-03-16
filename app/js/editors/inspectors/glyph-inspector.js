'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const operations = require(`../../operations/index`);

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

const UNICODE = require(`../../unicode`);

const GlyphIItem = require(`./glyph-iitem`);

class GlyphInspector extends nkm.datacontrols.InspectorView {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._svgPaste = operations.commands.ImportClipboard;
        this._ctrls = [];
        this._idList = [
            mkfData.IDS.GLYPH_NAME,
            mkfData.IDS.WIDTH,
            mkfData.IDS.HEIGHT
        ];

        this._variantCtrl = null;
        this._variantNoneCtrl = null;

        this._dataObserver
            .Hook(nkm.com.SIGNAL.ITEM_ADDED, this._OnVariantAdded, this)
            .Hook(nkm.com.SIGNAL.ITEM_REMOVED, this._OnVariantRemoved, this);
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

            }
        }, super._Style());
    }

    _Render() {
        super._Render();
        this._glyphIdentity = this.Add(mkfWidgets.GlyphIdentity, `identity`, this._host);
        //this._body = ui.El(`div`, { class: `body` }, this._host);
        this._variantCtrl = this.Add(GlyphIItem, `variant`, this._host);

        this.forwardData.To(this._variantCtrl, { dataMember: `defaultGlyph` });

    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        if (!this._data) {

        } else {
            this._glyphIdentity.glyphInfos = this._data.unicodeInfos;
        }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        if (p_data.isNull) { this._glyphIdentity.glyphInfos = p_data.unicodeInfos; }
    }

    _OnVariantAdded(p_glyph, p_glyphVariant) {
        /*
        let variantCtrl = this.Add(GlyphIItem, `variant`, this._body);

        this._variantCtrls.Add(variantCtrl);
        this._variantMap.Set(p_glyphVariant, variantCtrl);

        variantCtrl.data = p_glyphVariant;
        */
    }

    _OnVariantRemoved(p_glyph, p_glyphVariant) {
        /*
        let variantCtrl = this._variantMap.Get(p_glyphVariant);
        this._variantCtrls.Remove(variantCtrl);
        this._variantMap.Remove(p_glyphVariant);
        variantCtrl.Release();
        */
    }

    _OnDisplayGain() {
        super._OnDisplayGain();
        this._svgPaste.emitter = this;
        this._svgPaste.Enable();
    }

    _OnDisplayLost() {
        super._OnDisplayLost();
        if (this._svgPaste.emitter == this) { this._svgPaste.Disable(); }
    }

}

module.exports = GlyphInspector;