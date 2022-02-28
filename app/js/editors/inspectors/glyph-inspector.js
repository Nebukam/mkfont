'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const operations = require(`../../operations/index`);

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

const UNICODE = require(`../../unicode`);

const GlyphVariantInspector = require(`./glyph-iitem`);

class GlyphInspector extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._svgPaste = operations.commands.ClipboardReadSVG;
        this._ctrls = [];
        this._idList = [
            mkfData.IDS.GLYPH_NAME,
            mkfData.IDS.WIDTH,
            mkfData.IDS.HEIGHT
        ];
        this._variantCtrls = new nkm.collections.List();
        this._variantMap = new nkm.collections.Dictionary();
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
            '.unicode-preview': {
                'text-align': 'center',
                //'margin': '0',
                //'font-size': 'large',
                'user-select': 'text',
                'padding': '10px',
                'text-transform': 'lowercase',
            },
            '.unicode-preview:first-letter': {
                'text-transform': 'uppercase',
            }
        }, super._Style());
    }

    _Render() {
        super._Render();
        this._unicode = new ui.manipulators.Text(ui.dom.El(`code`, { class: `unicode-preview` }, this));
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        let glyphData = this._data ? this._data.data : null;
        if (!glyphData) {
            for (let i = 0; i < this._variantCtrls.count; i++) { this._variantCtrls.At(i).Release(); }
            this._variantCtrls.Clear();
        } else {
            let vList = glyphData._glyphVariants;
            for (let i = 0, n = vList.count; i < n; i++) {
                this._OnVariantAdded(glyphData, glyphData.GetVariant(vList.At(i)));
            }
        }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        let glyphData = p_data.data,
            unc = glyphData.Get(mkfData.IDS.UNICODE),
            obj = UNICODE.GetSingle(unc),
            uncDesc = obj
                ? `(${obj.block.name}) ${obj.name}`
                : unc;

        this._unicode.Set(uncDesc);
    }

    _OnVariantAdded(p_glyph, p_glyphVariant) {
        let variantCtrl = this.Add(GlyphVariantInspector, `variant`);

        this._variantCtrls.Add(variantCtrl);
        this._variantMap.Set(p_glyphVariant, variantCtrl);

        variantCtrl.data = p_glyphVariant;
    }

    _OnVariantRemoved(p_glyph, p_glyphVariant) {
        let variantCtrl = this._variantMap.Get(p_glyphVariant);
        this._variantCtrls.Remove(variantCtrl);
        this._variantMap.Remove(p_glyphVariant);
        variantCtrl.Release();
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