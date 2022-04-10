'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const operations = require(`../../operations/index`);

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

const SIGNAL = require(`../../signal`);
const UNICODE = require(`../../unicode`);

const TransformSettingsInspector = require(`./tr-settings-inspector`);

class GlyphListInspector extends nkm.datacontrols.ListInspectorView {
    constructor() { super(); }

    static __controls = [
        //{ cl: mkfWidgets.ControlHeader, options: { label: `Export` } },
        //{ options: { propertyId: mkfData.IDS.EXPORT_GLYPH } },
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

        this._contextObserver
            .Hook(SIGNAL.GLYPH_ADDED, this._OnGlyphAdded, this)
            .Hook(SIGNAL.GLYPH_REMOVED, this._OnGlyphRemoved, this);


        this._transformReference = new mkfData.TransformSettings();
        this._transformReference.Watch(nkm.data.SIGNAL.VALUE_CHANGED, this._OnTransformValueChanged, this);

        this._ignoreTransformUpdates = false;
        this._delayedInspectorRefresh = nkm.com.DelayedCall(this._Bind(this._RefreshTransformInspector));

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'padding': '10px',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'position': 'relative'
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
            },
            '.infos': {
                '@': [`absolute-center`]
            }
        }, super._Style());
    }

    _Render() {
        super._Render();
        this._tempLabel = new ui.manipulators.Text(ui.El(`div`, { class: `infos label` }, this._host));
        this._transformInspector = this.Attach(TransformSettingsInspector, `inspector`, this);
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._tempLabel.Set(`${this.itemCount} glyphs currently selected.`);
        this._RefreshTransformInspector();
    }

    _GetActiveVariant(p_unicodeInfos) {
        if (!this._context || !p_unicodeInfos) { return null; }
        return this._context.GetGlyph(p_unicodeInfos.u).GetVariant(this._context.selectedSubFamily);
    }

    _OnGlyphAdded(p_family, p_glyph) { this._delayedInspectorRefresh.Schedule(); }

    _OnGlyphRemoved(p_family, p_glyph) { this._delayedInspectorRefresh.Schedule(); }

    _OnTransformValueChanged(p_data, p_id, p_valueObj, p_oldValue) {
        if (this._ignoreTransformUpdates) { return; }
        // Apply new value to all glyphs within active selection
    }

    _RefreshTransformInspector() {
        this._transformInspector.data = null;
        if (this._FindCommonValues()) {
            this._transformInspector.data = this._transformReference;
            this._transformInspector.visible = true;
        } else {
            this._transformInspector.visible = false;
        }
    }

    _FindCommonValues() {
        this._ignoreTransformUpdates = true;

        let trValues = this._transformReference._values;

        for (var v in trValues) {
            trValues[v].value = null;
        }

        if (this._data) {

            let
                ignore = new Set(),
                ttval = 0,
                searchState = 0,
                ttGlyphs = this._data.stack.count;

            for (var v in trValues) { ttval++; }

            compareloop: for (let i = 0; i < ttGlyphs; i++) {

                let g = this._GetActiveVariant(this._data.stack.At(i));

                if (g.glyph.isNull) { continue; }

                if (searchState == 0) {
                    // Establish baseline values
                    for (var v in trValues) { this._transformReference.Set(v, g._transformSettings.Get(v)); }
                    searchState = 1;
                } else {
                    // Reach comparison
                    searchState = 2;
                    for (var v in trValues) {

                        let val = g._transformSettings.Get(v);

                        if (ignore.has(v)) { continue; }

                        let gVal = this._transformReference.Get(v);

                        if (gVal == null || gVal == val) {
                            // Equals baseline, keep going
                            continue;
                        } else {
                            // Mismatch, reset & ignore from now on
                            this._transformReference.Set(v, null);
                            ignore.add(v);
                            if (ignore.size == ttval) { break compareloop; }
                        }
                    }

                }
            }

            if (searchState == 2) {
                this._ignoreTransformUpdates = false;
                return true;
            }

        }

        this._ignoreTransformUpdates = false;
        return false;

    }

}

module.exports = GlyphListInspector;