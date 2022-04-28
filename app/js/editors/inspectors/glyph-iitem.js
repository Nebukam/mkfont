'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const uilib = nkm.uilib;

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfOperations = require(`../../operations`);
const mkfCmds = mkfOperations.commands;

const TransformSettingsInspector = require(`./tr-settings-inspector`);
const SIGNAL = require("../../signal");

const __nullGlyph = `null-glyph`;
const __hasPopout = `has-popout`;

const shouldHideWIDTH = (owner) => {
    if (!owner.data) { return true; }
    return !(owner.data._transformSettings.Get(mkfData.IDS.TR_AUTO_WIDTH) && owner.data._transformSettings.Get(mkfData.IDS.TR_SCALE_MODE) != mkfData.ENUMS.SCALE_NORMALIZE);
};

const base = nkm.datacontrols.ControlWidget;
class GlyphVariantInspectorItem extends base {
    constructor() { super(); }

    static __controls = [
        { cl: mkfWidgets.ControlHeader, options: { label: `Metrics` } },
        { options: { propertyId: mkfData.IDS.WIDTH }, disableWhen: { fn: shouldHideWIDTH } },
        { options: { propertyId: mkfData.IDS.HEIGHT } },
        { cl: mkfWidgets.ControlHeader, options: { label: `Export` } },
        { options: { propertyId: mkfData.IDS.EXPORT_GLYPH } },
    ];

    _Init() {
        super._Init();

        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;

        this._flags.Add(this, __nullGlyph, __hasPopout);
        this._obstructedPreview = false;

        this._rectTracker = new ui.helpers.RectTracker(this._Bind(this._OnPreviewRectUpdate));

        this._dataObserver.Hook(SIGNAL.VARIANT_UPDATED, () => { this._OnDataUpdate(this._data); }, this);
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
                'display': 'flex',
                'flex-flow': 'row wrap',
                'justify-content': `space-between`,
            },
            '.preview': {
                'position': 'relative',
                'display': 'flex',
                'aspect-ratio': '1/1',// 'var(--preview-ratio)',
                'flex': '1 1 auto',
                'width': '100%',
                'overflow': 'hidden',
                'background-color': 'rgba(0,0,0,0.5)',
                'border-radius': '5px',
            },
            ':host(.has-popout) .preview': { 'opacity': '0.25' },
            '.toolbar': {
                'flex': `1 1 auto`,
                'justify-content': `center`,
                'margin-bottom': '5px',
                'margin-top': '5px',
                'padding': '4px',
                'border-radius': '4px',
                'background-color': `rgba(19, 19, 19, 0.25)`
            },
            ':host(.null-glyph) .settings': { 'display': 'none' },
            '.settings': {
                'flex': '1 1 auto',
                'margin-bottom': '10px',
            },
            '.control': {
                'margin-bottom': '5px',
            },
            '.binder': {
                'width': '100%',
                'margin-top': '10px'
            }


        }, base._Style());
    }

    _Render() {

        this._importToolbar = this.Attach(ui.WidgetBar, `toolbar`, this._host);
        this._importToolbar.stretch = ui.WidgetBar.FLAG_STRETCH;

        this._glyphPreview = this.Attach(mkfWidgets.GlyphPreview, `preview`, this._host);
        this.forwardData.To(this._glyphPreview);
        this._rectTracker.Add(this._glyphPreview);

        this._importToolbar.options = {
            inline: true,
            defaultWidgetClass: nkm.uilib.buttons.Tool,
            handles: [
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
                    icon: `reset`, htitle: `Reset existing glyph or create an empty one if it doesn't exists.`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdGlyphClear.Execute(this._data); } },
                    group: `read`, member: { owner: this, id: `_glyphClearBtn` }
                },
                {
                    icon: `document-edit`, htitle: `Edit using default SVG editor`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdEditInPlace.Execute(this._data); } },
                    group: `write`, member: { owner: this, id: `_editInPlaceBtn` }
                },
                {
                    icon: `clipboard-write`, htitle: `Copy glyph to clipboard (ctrl+c)`,
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

        this._binder = this.Attach(mkfWidgets.ResourceBinding, `binder control`);
        this._binder.visible = false;
        this._transformInspector = this.Attach(TransformSettingsInspector, `settings`);
        this.forwardData.To(this._transformInspector, { dataMember: `transformSettings` });

        this._builder.host = ui.El(`div`, { class: `settings` }, this._host);

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
                anchor: this._transformInspector,
                placement: ui.ANCHORING.LEFT,
                origin: ui.ANCHORING.RIGHT,
                keepWithinScreen: true,
                static: true,
                content: mkfWidgets.GlyphPreview
            });
            this._popoutPreview.content.data = this._data;
            this._popoutPreview.content.glyphInfos = this._glyphInfos;
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
            if (this._popoutPreview) { this._popoutPreview.content.glyphInfos = this._glyphInfos; }
        } else {
            this._binder.data = null;
        }

        if (this._popoutPreview) { this._popoutPreview.content.data = this._data; }

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
    }

    _CleanUp() {
        this._obstructedPreview = false;
        this._TogglePopOutPreview(false);
        super._CleanUp();
    }

}

module.exports = GlyphVariantInspectorItem;