'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const uilib = nkm.uilib;

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfOperations = require(`../../operations`);

const TransformSettingsInspector = require(`./tr-settings-inspector`);

const __nullGlyph = `null-glyph`;

class GlyphVariantInspectorItem extends nkm.datacontrols.ControlWidget {
    constructor() { super(); }

    static __controls = [
        { cl: mkfWidgets.ControlHeader, options: { label: `Metrics` } },
        { options: { propertyId: mkfData.IDS.WIDTH } },//, css:'helf'
        { options: { propertyId: mkfData.IDS.HEIGHT } },//, css:'helf'
        //{ cl: mkfWidgets.ControlHeader, options: { label: `Metadata` } },
        //{ options: { propertyId: mkfData.IDS.GLYPH_NAME } },//, css:'separator' 
    ];

    _Init() {
        super._Init();
        this._svgPaste = mkfOperations.commands.ImportClipboard;

        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;

        this._subFamily = null;

        this._flags.Add(this, __nullGlyph);

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
                //'margin-bottom': '10px',
                'flex': `1 1 auto`,
                'justify-content': `center`,
                'border-top': `1px solid rgba(127, 127, 127, 0.1)`,
            },
            '.settings': {
                'flex': '1 0 100%',
                'margin-bottom': '10px'
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
                'color': 'rgba(255,255,255,0.05)',
                'font-family': 'monospace',
                'line-height': '100%'
            },
            '.oob':{
                '@':['absolute-centered']
            }
        }, super._Style());
    }

    _Render() {

        this._importToolbar = this.Add(ui.WidgetBar, `toolbar`, this._host);

        this._previewBox = ui.dom.El(`div`, { class: `preview` }, this._host);
        this._svgPlaceholder = new ui.manipulators.Text(ui.dom.El(`div`, { class: `box placeholder` }, this._previewBox), false, false);

        this._glyphRenderer = this.Add(mkfWidgets.GlyphCanvasRenderer, `renderer`, this._previewBox);
        this._glyphRenderer.options = {
            drawGuides: true,
            drawLabels: true,
            centered: false,
        };


        this._importToolbar.options = {
            inline: true,
            defaultWidgetClass: nkm.uilib.buttons.Tool,
            handles: [
                {
                    icon: `document-download-small`, htitle: `Import SVG`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: {
                        fn: () => {
                            mkfOperations.commands.ImportExternalFile.emitter = this;
                            mkfOperations.commands.ImportExternalFile.Execute(this._data);
                        }
                    },
                    group: `read`
                },
                {
                    icon: `clipboard-read`, htitle: `Import clipboard content`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: {
                        fn: () => {
                            mkfOperations.commands.ImportClipboard.emitter = this;
                            mkfOperations.commands.ImportClipboard.Execute(this._data);
                        }
                    },
                    group: `read`
                },/*
                {
                    icon: `edit`, htitle: `Edit using default SVG editor`,
                    variant: ui.FLAGS.MINIMAL,
                    group: `read`, member: { owner: this, id: `_editInPlaceBtn` }
                },*/
                {
                    icon: `clipboard-write`, htitle: `Copy glyph to clipboard`,
                    variant: ui.FLAGS.MINIMAL,
                    group: `write`, member: { owner: this, id: `_writeToClipboardBtn` }
                },
            ]
        };

        this._transformInspector = this.Add(TransformSettingsInspector, `settings`);
        this.forwardData.To(this._transformInspector, { dataMember: `transformSettings` });

        this._builder.host = ui.El(`div`, { class: `settings` }, this._host);

        this._oobTag = this.Add(uilib.widgets.Tag, `oob`, this._previewBox);
        this._oobTag.options = {
            label:`out of bounds`,
            flavor:nkm.com.FLAGS.ERROR,
            htitle:`The glyph is out of bounds and won't be added to the font.\nKeep it within -32000..32000`
        };
        this._oobTag.visible = false;

        super._Render();

    }

    get glyphInfos() { return this._glyphInfos; }
    set glyphInfos(p_value) {
        if (this._glyphInfos == p_value) { return; }

        this._glyphInfos = p_value;

        let unicodeCharacter = ``;

        if (nkm.utils.isNumber(this._glyphInfos)) {
            unicodeCharacter = UNICODE.GetUnicodeCharacter(this._glyphInfos);
        } else if (nkm.utils.isString(this._glyphInfos)) {
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
            this._writeToClipboardBtn.disabled = isNullGlyph;
            //this._editInPlaceBtn.disabled = isNullGlyph;
        }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._glyphRenderer.Set(p_data);
        this.glyphInfos = p_data.glyph.unicodeInfos;
        this._oobTag.visible = p_data.Get(mkfData.IDS.OUT_OF_BOUNDS);
    }



}

module.exports = GlyphVariantInspectorItem;