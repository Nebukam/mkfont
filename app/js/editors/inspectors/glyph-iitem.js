'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const MiniHeader = nkm.datacontrols.widgets.MiniHeader;
const ValueControl = nkm.datacontrols.widgets.ValueControl;

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

const LOC = require(`../../locales`);

const TransformSettingsInspector = require(`./tr-settings-inspector`);
const SIGNAL = require("../../signal");

const __nullGlyph = `null-glyph`;
const __hasPopout = `has-popout`;

const shouldHideWIDTH = (owner) => {
    if (!owner.data) { return true; }
    return !(owner.data._transformSettings.Get(mkfData.IDS.TR_AUTO_WIDTH) && owner.data._transformSettings.Get(mkfData.IDS.TR_SCALE_MODE) != mkfData.ENUMS.SCALE_NORMALIZE);
};
const shouldHideFLAT = (owner) => {
    if (!owner.data) { return true; }
    return owner.data.Get(mkfData.IDS.FLATTEN_LAYERS);
};

const base = nkm.datacontrols.ControlView;
class GlyphVariantInspectorItem extends base {
    constructor() { super(); }

    static __controls = [
        { cl: MiniHeader, options: { label: `Metrics` } },
        { options: { propertyId: mkfData.IDS.WIDTH }, disableWhen: { fn: shouldHideWIDTH } },
        { options: { propertyId: mkfData.IDS.HEIGHT } },
        //{ cl: MiniHeader, options: { label: `Export` } },
        //{ options: { propertyId: mkfData.IDS.DO_EXPORT } },
    ];

    static __glyphControls = [
        { cl: MiniHeader, options: { label: `Export` } },
        { options: { propertyId: mkfData.IDS.DO_EXPORT }, css: `full` },
    ];

    _Init() {
        super._Init();

        this._builder.defaultControlClass = ValueControl;

        this._flags.Add(this, __nullGlyph, __hasPopout);
        this._obstructedPreview = false;

        this._rectTracker = new ui.helpers.RectTracker(this._Bind(this._OnPreviewRectUpdate));

        this._dataObserver
            .Hook(SIGNAL.SELECTED_LAYER_CHANGED, (p_variant, p_layer) => { this._UpdatePreviewLayer(p_layer); }, this)
            .Hook(SIGNAL.VARIANT_UPDATED, () => { this._OnDataUpdate(this._data); }, this);
    }

    _OnPaintChange() {
        super._OnPaintChange();
        if (this._isPainted) {
            this._rectTracker.Enable();
        } else {
            this._rectTracker.Disable();
        }
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                ...nkm.style.flex.column,
            },
            '.item': {
                'margin-bottom': '5px',
            },
            '.preview': {
                'display': 'flex',
                ...nkm.style.flexItem.fill,
                'width': 'calc(100% - 6px)',
                'overflow': 'hidden',
                'background-color': 'rgba(0,0,0,0.5)',
                'border-radius': '5px',
            },
            ':host(.has-popout) .preview': { 'opacity': '0.25' },
            '.toolbar': {
                ...nkm.style.flexItem.fill,
                'justify-content': `center`,
                'margin-top': '5px',
                'padding': '4px 0px',
                'border-radius': '4px',
                'background-color': `rgba(19, 19, 19, 0.25)`
            },
            ':host(.null-glyph) .foldout:not(.always-visible)': { 'display': 'none' },
            '.foldout': {
                ...nkm.style.flexItem.fill,
            },
            '.binder': {
                'width': '100%',
                'margin-top': '10px'
            }


        }, base._Style());
    }

    _Render() {

        this._importToolbar = this.Attach(ui.WidgetBar, `item toolbar`, this._host);
        this._importToolbar.options = {
            inline: true,
            stretch: ui.WidgetBar.FLAG_STRETCH,
            defaultWidgetClass: nkm.uilib.buttons.Tool,
            handles: [
                {
                    icon: `reset`, htitle: `Reset existing glyph or create an empty one if it doesn't exists.\n---\n+ [ Shift ] Also create components matching character decomposition.\n+ [ Alt ] Reset the glyph path while preserving everything else.\n+ [ Shift + Alt ] Create components & missing glyphs recursively.`,
                    trigger: { fn: () => { this.editor.cmdGlyphClear.Execute(this._data); } },
                    group: `edit`, member: { owner: this, id: `_glyphClearBtn` }
                },
                {
                    icon: `document-download-small`, htitle: `Import SVG`,
                    flavor: nkm.com.FLAGS.LOADING, variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdImportFileSingle.Execute(this._data); } },
                    group: `read`
                },
                {
                    icon: `clipboard-read`, htitle: `Import clipboard content`,
                    flavor: nkm.com.FLAGS.LOADING, variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdGlyphPaste.Execute(this._glyphInfos); } },
                    group: `read`
                },
                {
                    icon: `document-edit`, htitle: `Edit using default SVG editor`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdEditInPlace.Execute(this._data); } },
                    group: `write`, member: { owner: this, id: `_editInPlaceBtn` }
                },
                {
                    icon: `clipboard-write`, htitle: `Copy glyph to clipboard  [ Ctrl C ]`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdGlyphCopy.Execute(this._glyphInfos); } },
                    group: `write`, member: { owner: this, id: `_copyPathBtn` }
                },
                {
                    icon: `remove`, htitle: `Delete Glyph from font`,
                    variant: ui.FLAGS.MINIMAL, flavor: nkm.com.FLAGS.ERROR,
                    trigger: { fn: () => { this.editor.cmdGlyphDelete.Execute(this._data); } },
                    group: `delete`, member: { owner: this, id: `_glyphDeleteBtn` }
                },
            ]
        };

        this._glyphPreview = this.Attach(mkfWidgets.GlyphPreview, `item preview`, this._host);
        this.forwardData.To(this._glyphPreview);
        this._rectTracker.Add(this._glyphPreview);

        //Transforms

        let foldout = nkm.uilib.views.Foldout(this, {
            title: LOC.labelTr, icon: `font-bounds`, prefId: `transforms`, expanded: true,
            handles: [
                {
                    icon: 'clipboard-read', htitle: 'Paste transforms  [ Ctrl Alt V ]',
                    trigger: { fn: () => { this.editor.cmdGlyphPasteTransform.Execute(this._data); } },
                }
            ],
            controls: [
                { cl: TransformSettingsInspector, get: `_transformSettings` },
            ]
        });

        this._builder.host = foldout.body;

        //Layers

        nkm.uilib.views.Foldout(this, {
            title: LOC.labelLayers, icon: `component`, prefId: `layers`, expanded: true,
            handles: [
                {
                    icon: 'clipboard-read', htitle: 'Paste components\n---\n+ [ Shift ] Add instead of replace\n+ [ Alt ] Only copy transforms',
                    trigger: { fn: () => { this.editor.cmdLayersPaste.Execute(this._data); } },
                },
            ],
            controls: [
                { options: { propertyId: mkfData.IDS.FLATTEN_LAYERS } },
                { options: { propertyId: mkfData.IDS.FLATTEN_MODE }, hideWhen: { fn: shouldHideFLAT } },
                { cl: mkfWidgets.LayersView, member: { owner: this, id: `_layers` } },
            ]
        });

        // Settings

        nkm.uilib.views.Foldout(this, {
            title: LOC.labelSettings, icon: `gear`, prefId: `glyphSettings`, expanded: true,
            controls: [
                //{ cl: MiniHeader, options: { label: `Export` } },
                { options: { propertyId: mkfData.IDS.DO_EXPORT } },
            ]
        });

        this._binder = this.Attach(mkfWidgets.ResourceBinding, `full`, foldout);
        this._binder.visible = false;

        super._Render();

        this.focusArea = this;
        
    }

    get glyphInfos() { return this._glyphInfos; }
    set glyphInfos(p_value) {
        if (this._glyphInfos == p_value) { return; }
        this._glyphInfos = p_value;
        this._glyphPreview.glyphInfos = p_value;
    }

    _OnPreviewRectUpdate(p_tracker) {
        let ratio = p_tracker.GetRatio(this._glyphPreview);
        if (ratio < 0.9) {
            this._obstructedPreview = true;
            this._TogglePopOutPreview(true);
        } else {
            this._obstructedPreview = false;
            this._TogglePopOutPreview(false);
        }
    }

    _TogglePopOutPreview(p_toggle) {

        if (!this._isFocused || !this._obstructedPreview || !this._data) { p_toggle = false; }

        if (this._hasPopOut == p_toggle) { return; }

        this._hasPopOut = p_toggle;
        this._flags.Set(__hasPopout, p_toggle);

        if (!p_toggle) {
            if (this._popoutPreview) {
                this._popoutPreview.Release();
                this._popoutPreview = null;
            }
        } else {
            this._popoutPreview = uilib.modals.Simple.Pop({
                anchor: this.parent,
                placement: ui.ANCHORING.LEFT,
                origin: ui.ANCHORING.RIGHT,
                keepWithinScreen: true,
                static: true,
                content: mkfWidgets.GlyphPreview
            });
            this._popoutPreview.content.classList.add(`floating`);
            this._popoutPreview.content.data = this._data;
            this._popoutPreview.content.glyphInfos = this._glyphInfos;
            this._UpdatePreviewLayer();
        }

    }

    _FocusGain() {
        super._FocusGain();
        this._TogglePopOutPreview(true);
    }

    _FocusLost() {
        super._FocusLost();
        this._TogglePopOutPreview(false);
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);

        if (this._data) {
            let isNullGlyph = this._data.glyph.isNull;
            this._flags.Set(__nullGlyph, isNullGlyph);
            this._copyPathBtn.disabled = isNullGlyph;
            this._editInPlaceBtn.disabled = isNullGlyph;
            this._glyphDeleteBtn.disabled = isNullGlyph;
            if (this._popoutPreview) {
                this._popoutPreview.content.glyphInfos = this._glyphInfos;
            }
        } else {
            this._binder.data = null;
        }

        if (this._popoutPreview) { this._popoutPreview.content.data = this._data; }

    }

    _UpdatePreviewLayer(p_layer) {
        this._glyphPreview.glyphLayer = this._data.selectedLayer;
        if (this._popoutPreview) { this._popoutPreview.content.glyphLayer = this._data.selectedLayer; }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        let isNullGlyph = p_data.glyph.isNull;
        if (isNullGlyph) {
            p_data.glyph.unicodeInfos = this._glyphInfos;
            this._binder.data = null;
            this._editInPlaceBtn.disabled = true;
        } else {
            let binding = this.editor._bindingManager.Get(p_data);
            this._binder.data = binding;
            this._editInPlaceBtn.disabled = binding ? true : false;
        }
        this._UpdatePreviewLayer();
    }

    _CleanUp() {
        this._obstructedPreview = false;
        this._TogglePopOutPreview(false);
        super._CleanUp();
    }

}

module.exports = GlyphVariantInspectorItem;