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

const shouldHideWIDTH = (owner) => {
    if (!owner.data) { return true; }
    return owner.data.Get(mkfData.IDS.TR_HOR_ALIGN) != mkfData.ENUMS.HALIGN_XMIN;
};

class GlyphVariantInspectorItem extends nkm.datacontrols.ControlWidget {
    constructor() { super(); }

    static __controls = [
        { cl: mkfWidgets.ControlHeader, options: { label: `Metrics` } },
        { options: { propertyId: mkfData.IDS.WIDTH }, hideWhen: { fn: shouldHideWIDTH } },//, css:'helf'
        { options: { propertyId: mkfData.IDS.HEIGHT } },//, css:'helf'
        //{ cl: mkfWidgets.ControlHeader, options: { label: `Metadata` } },
        //{ options: { propertyId: mkfData.IDS.GLYPH_NAME } },//, css:'separator' 
    ];

    _Init() {
        super._Init();

        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;

        this._flags.Add(this, __nullGlyph);

        this._dataObserver.Hook(SIGNAL.VARIANT_UPDATED, () => { this._OnDataUpdate(this._data); }, this);

    }

    _OnPaintChange() {
        super._OnPaintChange();
        if (this._isPainted) {

        } else {

        }
    }

    _Style() {
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
            '.renderer': {
                'position': 'relative',
                'width': '100%',
                'aspect-ratio': '1/1',
            },
            '.toolbar': {
                'flex': `1 1 auto`,
                'justify-content': `center`,
                'margin-bottom': '5px',
                'margin-top': '5px',
                'padding': '4px',
                'border-radius': '4px',
                'background-color': `rgba(19, 19, 19, 0.25)`
            },
            '.settings': {
                'flex': '1 1 auto',
                'margin-bottom': '10px',
            },
            ':host(.null-glyph) .settings, :host(:not(.null-glyph)) .placeholder': { 'display': 'none' },
            '.control': {
                'margin-bottom': '5px',
            },
            '.placeholder': {
                'flex': '1 0 100%',
                'position': 'relative',
                'display': `grid`,
                'place-items': `center`,
                'text-align': `center`,
                'font-size': '10em',
                'user-select': 'none',
                'color': 'rgba(255,255,255,0.25)',
                'font-family': 'monospace',
                'line-height': '100%'
            },
            '.infoTag': {
                '@': ['absolute-center']
            },
            '.emptyTag': {
                '@': ['absolute-bottom'],
                'margin': `5px`
            }


        }, super._Style());
    }

    _Render() {

        this._importToolbar = this.Attach(ui.WidgetBar, `toolbar`, this._host);
        this._importToolbar.stretch = ui.WidgetBar.FLAG_STRETCH;

        this._previewBox = ui.dom.El(`div`, { class: `preview` }, this._host);
        this._svgPlaceholder = new ui.manipulators.Text(ui.dom.El(`div`, { class: `box placeholder` }, this._previewBox), false, false);

        this._glyphRenderer = this.Attach(mkfWidgets.GlyphCanvasRenderer, `renderer`, this._previewBox);
        this._glyphRenderer.options = {
            drawGuides: true,
            drawLabels: true,
            drawBBox: true,
            centered: false,
            normalize: true
        };

        this._importToolbar.options = {
            inline: true,
            defaultWidgetClass: nkm.uilib.buttons.Tool,
            handles: [
                {
                    icon: `document-download-small`, htitle: `Import SVG`,
                    flavor: nkm.com.FLAGS.LOADING, variant: ui.FLAGS.MINIMAL,
                    trigger: {
                        fn: () => {
                            mkfCmds.ImportExternalFile.emitter = this;
                            mkfCmds.ImportExternalFile.Execute(this._data);
                        }
                    },
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

        this._transformInspector = this.Attach(TransformSettingsInspector, `settings`);
        this.forwardData.To(this._transformInspector, { dataMember: `transformSettings` });

        this._builder.host = ui.El(`div`, { class: `settings` }, this._host);

        this._oobTag = this.Attach(uilib.widgets.Tag, `infoTag`, this._previewBox);
        this._oobTag.options = {
            label: `out of bounds`,
            flavor: nkm.com.FLAGS.ERROR,
            htitle: `The glyph is out of bounds and won't be added to the font.\nKeep it within -32000..32000`
        };
        this._oobTag.visible = false;

        this._emptyTag = this.Attach(uilib.widgets.Tag, `emptyTag`, this._previewBox);
        this._emptyTag.options = {
            label: `empty`,
            bgColor: nkm.style.Get(`--col-warning-dark`),
            htitle: `This glyph is void.`
        };
        this._emptyTag.visible = false;

        super._Render();

    }

    get glyphInfos() { return this._glyphInfos; }
    set glyphInfos(p_value) {
        if (this._glyphInfos == p_value) { return; }

        this._glyphInfos = p_value;

        let unicodeCharacter = ``;

        if (nkm.u.isNumber(this._glyphInfos)) {
            unicodeCharacter = UNICODE.GetUnicodeCharacter(this._glyphInfos);
        } else if (nkm.u.isString(this._glyphInfos)) {
            unicodeCharacter = this._glyphInfos;
        } else {
            unicodeCharacter = UNICODE.GetUnicodeCharacter(parseInt(this._glyphInfos.u, 16));
        }

        this._svgPlaceholder.Set(unicodeCharacter);
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);

        if (this._data) {
            let isNullGlyph = this._data.glyph.isNull;
            this._flags.Set(__nullGlyph, isNullGlyph);
            this._copyPathBtn.disabled = isNullGlyph;
            this._editInPlaceBtn.disabled = isNullGlyph;
            this._glyphDeleteBtn.disabled = isNullGlyph;

        }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._glyphRenderer.Set(p_data);
        this._oobTag.visible = p_data.Get(mkfData.IDS.OUT_OF_BOUNDS);
        this._emptyTag.visible = p_data.Get(mkfData.IDS.EMPTY);
    }



}

module.exports = GlyphVariantInspectorItem;