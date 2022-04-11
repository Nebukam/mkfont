'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const operations = require(`../../operations/index`);

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfOperations = require(`../../operations`);
const mkfCmds = mkfOperations.commands;

const SIGNAL = require(`../../signal`);
const UNICODE = require(`../../unicode`);

const TransformSettingsSilent = require(`./tr-settings-silent-inspector`);

const __invalidSelection = `sel-invalid`;

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

        this._dataObserver
            .Hook(nkm.com.SIGNAL.ITEM_BUMPED, this._OnGlyphBumped, this);

        this._contextObserver
            .Hook(SIGNAL.GLYPH_ADDED, this._OnGlyphAdded, this)
            .Hook(SIGNAL.GLYPH_REMOVED, this._OnGlyphRemoved, this)
            .Hook(nkm.com.SIGNAL.UPDATED, this._OnContextUpdated, this);

        this._flags.Add(this, __invalidSelection);

        this._transformReference = nkm.com.Rent(mkfData.TransformSettings);
        this._transformReference.Watch(nkm.com.SIGNAL.VALUE_CHANGED, this._OnTransformValueChanged, this);

        this._delayedInspectorRefresh = nkm.com.DelayedCall(this._Bind(this._RefreshTransformInspector));

        this._previews = [];
        this._cachedTransforms = null;

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'padding': '10px',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'position': 'relative'
            },
            ':host(.sel-invalid) .edit-body': { 'display': `none` },
            ':host(.sel-invalid) .infos': { 'display': `block` },
            '.edit-body': {
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'position': 'relative'
            },
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
                'position': 'relative',
                'grid-gap': `10px`,
                'display': 'grid',
                'grid-template-columns': 'auto auto',
                'grid-template-rows': 'auto auto',
                'justify-content': `center`,
                'align-content': `space-between`, //center
                'margin-bottom': `7px`
            },
            '.box': {
                'position': 'relative',
                'display': 'flex',
                'aspect-ratio': '1/1',// 'var(--preview-ratio)',
                'flex': '1 1 auto',
                'width': '100%',
                'overflow': 'hidden',
                'background-color': 'rgba(0,0,0,0.5)',
                'border-radius': '5px',
            },
            '.tag': {
                '@': [`absolute-bottom-right`],
                'margin': `10px`
            },
            '.infos': {
                'display': `none`,
                '@': [`absolute-center`],
                'text-align': `center`
            }
        }, super._Style());
    }

    _Render() {

        super._Render();
        this._tempLabel = new ui.manipulators.Text(ui.El(`div`, { class: `infos label` }, this._host));

        this._glyphIdentity = this.Attach(mkfWidgets.GlyphIdentity, `identity`, this._host);
        this._glyphIdentity.Multi(`GROUP<br>EDITING`, ``);

        this._importToolbar = this.Attach(ui.WidgetBar, `toolbar`, this._host);
        this._importToolbar.stretch = ui.WidgetBar.FLAG_STRETCH;

        this._editBody = ui.El(`div`, { class: `edit-body` }, this._host);

        this._previewCtnr = ui.El(`div`, { class: `previews` }, this._editBody);

        for (let i = 0; i < 4; i++) {
            let gr = this.Attach(mkfWidgets.GlyphCanvasRenderer, `box`, this._previewCtnr);
            this._previews.push(gr);
            gr.options = {
                drawGuides: true,
                drawBBox: true,
                centered: false,
                normalize: true
            }
        }

        this._counter = this.Attach(nkm.uilib.widgets.Tag, `tag`, this._previewCtnr);
        this._counter.label = `+50`;
        this._counter.bgColor = `var(--col-cta-dark)`;

        this._transformInspector = this.Attach(TransformSettingsSilent, `inspector`, this._editBody);

        //

        this._importToolbar.options = {
            inline: true,
            defaultWidgetClass: nkm.uilib.buttons.Tool,
            handles: [
                {
                    icon: `new`, htitle: `Empty selected glyph.\nClears existing data, or create an empty glyph in place of an empty unicode slot.`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: {
                        fn: () => {
                            mkfCmds.ImportEmpty.emitter = this;
                            mkfCmds.ImportEmpty.Execute(this._data.stack._array);
                        }
                    },
                    group: `read`
                },
                {
                    icon: `remove`, htitle: `Delete selection from font`,
                    variant: ui.FLAGS.MINIMAL,
                    flavor: nkm.com.FLAGS.ERROR,
                    trigger: {
                        fn: () => {
                            mkfCmds.DeleteGlyph.emitter = this;
                            mkfCmds.DeleteGlyph.Execute(this._data.analytics.existingInfos);
                        }
                    },
                    group: `delete`, member: { owner: this, id: `_deleteGlyphBtn` }
                },
            ]
        };

    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._RefreshTransformInspector();
    }

    _GetActiveVariant(p_unicodeInfos) {
        if (!this._context || !p_unicodeInfos) { return null; }
        return this._context.GetGlyph(p_unicodeInfos.u).GetVariant(this._context.selectedSubFamily);
    }

    _OnGlyphAdded(p_family, p_glyph) { this._delayedInspectorRefresh.Schedule(); }

    _OnGlyphRemoved(p_family, p_glyph) { this._delayedInspectorRefresh.Schedule(); }

    _OnContextUpdated(p_family) { this._delayedInspectorRefresh.Schedule(); }

    _OnTransformValueChanged(p_data, p_id, p_valueObj, p_oldValue) {
        // Apply new value to all glyphs within active selection
        let editor = this.editor;
        if (!editor) { return; }

        editor.Do(
            mkfOperations.actions.SetProperty, {
            target: this._cachedTransforms,
            id: p_id,
            value: p_valueObj.value
        });

    }

    _RefreshTransformInspector() {

        if (!this._data) { return; }

        this._transformInspector.data = null;
        let an = this._data.analytics;

        if (this._FindCommonValues()) {

            this._flags.Set(__invalidSelection, false);

            this._RefreshCachedTransforms();

            this._transformInspector.data = this._transformReference;
            this._transformInspector.visible = true;

            this._UpdatePreviews();

        } else {

            this._flags.Set(__invalidSelection, true);

            let label = `${an.total} glyphs currently selected.<br><br>`;
            if (an.existingGlyphs <= 1) {
                label += `<i>Select more <b>existing</b> glyphs to edit their properties.</i>`;
            }

            this._tempLabel.Set(label);

            this._transformInspector.visible = false;
            this._cachedTransforms = null;

        }

        this._glyphIdentity.Multi(`MULTIPLE SELECTION<br><b>${this._data.stack.count} Glyphs</b>`, an.uuni);
        this._deleteGlyphBtn.disabled = !(an.existingGlyphs > 0);

    }

    _RefreshCachedTransforms() {

        let recompute = this._cachedTransforms ? false : true;

        let existing = this._data.analytics.existing;

        if (!recompute) {
            if (existing.length == this._cachedTransforms.length) {
                checkloop: for (let i = 0; i < existing.length; i++) {
                    if (!this._cachedTransforms.includes(existing[i]._transformSettings)) {
                        recompute = true;
                        break checkloop;
                    }
                }
            } else { recompute = true; }
        }

        if (recompute) {
            this._cachedTransforms = [];
            for (let i = 0; i < existing.length; i++) {
                this._cachedTransforms.push(existing[i]._transformSettings);
            }
        }
    }

    _FindCommonValues() {

        let analytics = this._data.analytics;
        if (analytics.existingGlyphs == 0) { return false; }

        return mkfData.UTILS.FindCommonValues(
            this._transformReference,
            analytics.existing,
            `_transformSettings`
        );

    }

    _UpdatePreviews() {

        let an = this._data.analytics;

        if (an.existingGlyphs < 4) { for (let i = 0; i < 4; i++) { this._previews[i].visible = false; } }

        if (an.existingGlyphs > 4) {
            this._counter.visible = true;
            this._counter.label = `+${an.existingGlyphs - 4}`;
        } else {
            this._counter.visible = false;
        }

        for (let i = 0; i < Math.min(an.existingGlyphs, 4); i++) {
            let sqr = this._previews[i];
            sqr.visible = true;
            sqr.Set(an.existing[an.existingGlyphs - (i + 1)]);
        }

    }

    _OnGlyphBumped(p_data, p_infos) {
        this._UpdatePreviews();
    }

}

module.exports = GlyphListInspector;