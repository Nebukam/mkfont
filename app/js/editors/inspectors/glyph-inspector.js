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
        { cl: mkfWidgets.ControlHeader, options: { label: `Export` } },
        { options: { propertyId: mkfData.IDS.EXPORT_GLYPH } },
        //{ options: { propertyId: mkfData.IDS.GLYPH_NAME } },//, css:'separator' 
    ];

    _Init() {
        super._Init();
        this._svgCopy = operations.commands.ExportToClipboard;
        this._svgPaste = operations.commands.ImportClipboard;
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

        this._contextObserver
            .Watch(SIGNAL.GLYPH_ADDED, this._OnGlyphAdded, this)
            .Watch(SIGNAL.GLYPH_REMOVED, this._OnGlyphRemoved, this);

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

        this.forwardData.To(this._variantCtrl, { dataMember: `defaultGlyph` });
        this.forwardContext.To(this._variantCtrl);

        this._builder.host = ui.El(`div`, { class: `settings` }, this._host);

        super._Render();

    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        if (!this._data) {

        } else {
            this._glyphIdentity.glyphInfos = this._data.unicodeInfos;

            if (this._data.isNull) {
                this._builder.host.style.setProperty(`display`, `none`);
            } else {
                this._builder.host.style.removeProperty(`display`);
            }
        }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        if (p_data.isNull) { this._glyphIdentity.glyphInfos = p_data.unicodeInfos; }
    }

    _OnGlyphAdded(p_glyph) {
        
    }

    _OnGlyphRemoved(p_glyph) {

    }

    _OnDisplayGain() {
        super._OnDisplayGain();
        this._svgPaste.emitter = this;
        this._svgPaste.Enable();
        this._svgCopy.emitter = this;
        this._svgCopy.Enable();
    }

    _OnDisplayLost() {
        super._OnDisplayLost();
        if (this._svgPaste.emitter == this) { this._svgPaste.Disable(); }
        if (this._svgCopy.emitter == this) { this._svgCopy.Disable(); }
    }

}

module.exports = GlyphInspector;