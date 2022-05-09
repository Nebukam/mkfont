'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfOperations = require(`../../operations`);

const LOC = require(`../../locales`);
const SIGNAL = require(`../../signal`);

const Surveyor = require(`../helpers/surveyor`);
const TransformSettingsSilent = require(`./tr-settings-silent-inspector`);

const __invalidSelection = `sel-invalid`;
const __hasPopout = `has-popout`;

const shouldHideWIDTH = (owner) => {
    if (!owner.data) { return true; }
    return !(owner.data._transformSettings.Get(mkfData.IDS.TR_AUTO_WIDTH) && owner.data._transformSettings.Get(mkfData.IDS.TR_SCALE_MODE) != mkfData.ENUMS.SCALE_NORMALIZE);
};

const base = nkm.datacontrols.ListInspectorView;
class GlyphListInspector extends base {
    constructor() { super(); }

    static __controls = [];

    _Init() {
        super._Init();

        this._dataObserver
            .Hook(nkm.com.SIGNAL.ITEM_BUMPED, this._OnGlyphBumped, this);

        this._flags.Add(this, __invalidSelection, __hasPopout);

        this._surveyor = new Surveyor();
        this._surveyor.Watch(nkm.com.SIGNAL.UPDATED, this._OnSurveyorUpdate, this);
        this.forwardContext.To(this._surveyor);
        this.forwardEditor.To(this._surveyor);
        this.forwardData.To(this._surveyor);

        this._previews = [];

        this._rectTracker = new ui.helpers.RectTracker(this._Bind(this._OnPreviewRectUpdate));
        this.focusArea = this;

    }

    //#region DOM

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                'padding': '10px',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'position': 'relative'
            },
            ':host(.sel-invalid) .infos': { 'display': `block` },
            '.toolbar': {
                'flex': `0 0 auto`,
                'justify-content': `center`,
                'margin-bottom': '5px',
                'margin-top': '5px',
                'padding': '4px',
                'border-radius': '4px',
                'background-color': `rgba(19, 19, 19, 0.25)`
            },
            '.previews': {
                'flex': `0 0 auto`,
                'margin-bottom': '5px',
            },
            '.infos': {
                'display': `none`,
                '@': [`absolute-center`],
                'text-align': `center`
            },
            '.control, .drawer, .item': {
                'flex': '0 0 auto',
            },
            '.drawer': {
                'padding': `10px`,
                'background-color': `rgba(19, 19, 19, 0.25)`,
                'border-radius': '4px',
                'margin-bottom': '5px',
            },
            ':host(.sel-invalid) .drawer:not(.always-visible), :host(.sel-invalid) .previews': { 'display': 'none' },
        }, base._Style());
    }

    _Render() {


        this._tempLabel = new ui.manipulators.Text(ui.El(`div`, { class: `infos label` }, this._host));

        this._glyphIdentity = this.Attach(mkfWidgets.GlyphIdentity, `identity`, this._host);
        this._glyphIdentity.Multi(`GROUP<br>EDITING`, ``);

        this._importToolbar = this.Attach(ui.WidgetBar, `toolbar`, this._host);
        this._importToolbar.options = {
            stretch: ui.WidgetBar.FLAG_STRETCH,
            inline: true,
            defaultWidgetClass: nkm.uilib.buttons.Tool,
            handles: [
                {
                    icon: `reset`, htitle: `Reset existing glyphs & create missing ones.`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdGlyphClear.Execute(this._data.stack._array); } },
                    group: `read`
                },
                {
                    icon: `remove`, htitle: `Delete selection from font`,
                    variant: ui.FLAGS.MINIMAL,
                    flavor: nkm.com.FLAGS.ERROR,
                    trigger: { fn: () => { this.editor.cmdGlyphDelete.Execute(this._data.analytics.existingInfos); } },
                    group: `delete`, member: { owner: this, id: `_deleteGlyphBtn` }
                },
            ]
        };

        // Previews

        this._groupPreview = this.Attach(mkfWidgets.GlyphPreviewGroup, `previews`);
        this._rectTracker.Add(this._groupPreview);

        super._Render();

        // Transforms + local properties

        let foldout = this._Foldout(
            { title: LOC.labelTr, icon: `font-bounds`, prefId: `transforms`, expanded: true },
            [
                { cl: TransformSettingsSilent, dataMember: `_transformSettings` },
                { cl: mkfWidgets.ControlHeader, options: { label: `Metrics` } },
                { options: { propertyId: mkfData.IDS.WIDTH }, disableWhen: { fn: shouldHideWIDTH } },
                { options: { propertyId: mkfData.IDS.HEIGHT } },
            ]
        );

        // Layers

        foldout = this._Foldout(
            {
                title: LOC.labelLayers, icon: `component`, prefId: `layers`, expanded: true,
                handles: [
                    {
                        icon: 'clipboard-read', htitle: 'Paste layers (hold Alt to add instead of replace)',
                        trigger: {
                            fn: () => {
                                if (!this._surveyor._cachedVariants || this._surveyor._cachedVariants.length == 0) { return; }
                                this.editor.cmdLayersPaste.Execute(this._surveyor._cachedVariants);
                            }
                        },
                    },
                ]
            },
            [
                { cl: mkfWidgets.LayersViewSilent, member: `_layersView`, css: `foldout-item` },
            ]
        );

        this._layersView._toolbar.CreateHandles(
            {
                icon: `component-new`, htitle: `Create new component`,
                flavor: nkm.ui.FLAGS.CTA, variant: ui.FLAGS.MINIMAL,
                trigger: { fn: () => { this.editor.cmdLayerAdd.Execute(this._data.analytics.existing); } },
                group: `create`
            },
            {
                icon: `minus`, htitle: `Collapse all`,
                variant: ui.FLAGS.MINIMAL,
                trigger: { fn: () => { this._layersView._CollapseAll(); } },
                group: `ui`
            },
            {
                icon: `visible`, htitle: `Show all components`,
                variant: ui.FLAGS.MINIMAL,
                trigger: { fn: () => { this.editor.cmdLayersOn.Execute(this._data.analytics.existing); } },
                group: `edit`
            },
            {
                icon: `hidden`, htitle: `Hide all components`,
                variant: ui.FLAGS.MINIMAL,
                trigger: { fn: () => { this.editor.cmdLayersOff.Execute(this._data.analytics.existing); } },
                group: `edit`
            },
            {
                icon: `link`, htitle: `Create composition components.`,
                variant: ui.FLAGS.MINIMAL,
                trigger: { fn: () => { this.editor.cmdLayerAddComp.Execute(this._data.analytics.existing); } },
                group: `automate`, member: { owner: this, id: `_addCompBtn` }
            });


        // Settings

        foldout = this._Foldout(
            { title: LOC.labelSettings, icon: `gear`, prefId: `glyphSettings`, expanded: true },
            [
                { cl: mkfWidgets.ControlHeader, options: { label: `Export` } },
                { options: { propertyId: mkfData.IDS.DO_EXPORT }, css: `full` },
            ]
        );

        // Clear bindings
        this._clearBindings = this.Attach(nkm.uilib.buttons.Button, `foldout-item full`, foldout);
        this._clearBindings.options = {
            label: `Clear resource bindings`, icon: `remove`,
            trigger: { fn: () => { this._surveyor._ClearRscBindings(); } }
        };



    }

    _Foldout(p_foldout, p_controls, p_css = ``, p_host = null) {

        let foldout = this.Attach(nkm.uilib.widgets.Foldout, `item drawer${p_css ? ' ' + p_css : ''}`, p_host || this);
        foldout.options = p_foldout;

        if (p_controls) {
            let builder = new nkm.datacontrols.helpers.ControlBuilder(this);
            builder.options = { host: foldout, cl: mkfWidgets.PropertyControl, css: `foldout-item` };
            builder.Build(p_controls);
            if (!this._builders) { this._builders = []; }
            this._builders.push(builder);
        }

        return foldout;

    }

    //#endregion

    _FlushData() { this._builders.forEach(builder => { builder.data = null; }); }
    _ReassignData() { this._builders.forEach(builder => { builder.data = this._surveyor._refVariant; }); }

    _OnSurveyorUpdate(p_hasContent = false) {

        if (!this._data) { return; }

        this._flags.Set(__invalidSelection, !p_hasContent);

        let an = this._data.analytics;
        this._clearBindings.visible = this._surveyor.hasBinding;

        if (p_hasContent) {

            this._ReassignData();
            this._UpdatePreviews();

        } else {

            this._FlushData();

            let label = `${an.total} glyphs currently selected.<br><br>`;
            if (an.existingGlyphs <= 1) {
                label += `<i>Select more <b>existing</b> glyphs to edit their properties.</i>`;
            }

            this._tempLabel.Set(label);

        }

        this._glyphIdentity.Multi(`MULTIPLE SELECTION<br><b>${an.total} Glyphs</b>`, an.uuni);
        this._deleteGlyphBtn.disabled = !(an.existingGlyphs > 0);

    }

    _OnPaintChange() {
        super._OnPaintChange();
        if (this._isPainted) {
            this._rectTracker.Enable();
        } else {
            this._rectTracker.Disable();
        }
    }

    _UpdatePreviews() {
        this._groupPreview.data = this._data ? this._data.analytics.existing : null;
        //Would need to update popout there, too
    }

    _OnGlyphBumped(p_data, p_infos) { this._UpdatePreviews(); }

    //#region popout

    _RefLayerSelected(p_variant, p_layer) {
        this._sLayer = null;
        if (!this._layerMap) { return; }
    }

    _GetAtop() {
        if (!this._data) { return null; }
        let an = this._data.analytics;
        if (an.existingGlyphs <= 0) { return null; }
        return an.existing[an.existingGlyphs - 1];
    }

    _OnPreviewRectUpdate(p_tracker) {
        let ratio = p_tracker.GetRatio(this._groupPreview);
        if (ratio < 0.9) {
            this._obstructedPreview = true;
            this._TogglePopOutPreview(true);
        } else {
            this._obstructedPreview = false;
            this._TogglePopOutPreview(false);
        }
    }

    _TogglePopOutPreview(p_toggle) {


        let atop = this._GetAtop();

        if (!this._isFocused || !this._obstructedPreview || !atop) { p_toggle = false; }

        if (this._hasPopOut == p_toggle) { return; }

        this._hasPopOut = p_toggle;
        this._flags.Set(__hasPopout, p_toggle);

        if (!p_toggle) {
            if (this._popoutPreview) {
                this._popoutPreview.Release();
                this._popoutPreview = null;
            }
        } else {
            this._popoutPreview = nkm.uilib.modals.Simple.Pop({
                anchor: this.parent,
                placement: ui.ANCHORING.LEFT,
                origin: ui.ANCHORING.RIGHT,
                keepWithinScreen: true,
                static: true,
                content: mkfWidgets.GlyphPreviewGroup
            });

            this._popoutPreview.content.data = this._data ? this._data.analytics.existing : null;
            //this._popoutPreview.content.glyphInfos = atop ? atop.glyph.unicodeInfos : null;
            //this._UpdatePreviewLayer();
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

    _UpdatePreviewLayer(p_layer) {
        this._glyphPreview.glyphLayer = this._data.selectedLayer;
        //if (this._popoutPreview) { this._popoutPreview.content.glyphLayer = this._data.selectedLayer; }
    }

    //#endregion

    _CleanUp() {
        this._FlushData();
        this._obstructedPreview = false;
        this._TogglePopOutPreview(false);
        super._CleanUp();
    }
}

module.exports = GlyphListInspector;