'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const operations = require(`../../operations/index`);

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

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
        this._svgPaste = operations.commands.ClipboardReadSVG;

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
                //'border-bottom':'1px solid rgba(127, 127, 127, 0.1)',
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
            }
        }, super._Style());
    }

    _Render() {

        this._previewBox = ui.dom.El(`div`, { class: `preview` }, this._host);
        this._svgPlaceholder = new ui.manipulators.Text(ui.dom.El(`div`, { class: `box placeholder` }, this._previewBox), false, false);

        this._svgRenderer = this.Add(mkfWidgets.GlyphCanvasRenderer, `renderer`, this._previewBox);
        this._svgRenderer.drawGuides = true;
        this._svgRenderer.drawLabels = true;
        this._svgRenderer.centered = false;

        this._dataToolbar = this.Add(ui.WidgetBar, `toolbar`, this._host);

        this._dataToolbar._defaultWidgetClass = nkm.uilib.buttons.Tool;
        this._dataToolbar.inline = true;
        //this._dataToolbar._stretchEnum.Set(`stretch`);

        this._dataToolbar.CreateHandles(
            {
                icon: `document-download-small`, htitle: `Import SVG`,
                variant: ui.FLAGS.MINIMAL,
                trigger: {
                    fn: () => {
                        operations.commands.ImportExternalFile.emitter = this;
                        operations.commands.ImportExternalFile.Execute(this._data);
                    }
                },
                group: `modify`
            },
            {
                icon: `clipboard-read`, htitle: `Import clipboard content`,
                variant: ui.FLAGS.MINIMAL,
                group: `modify`
            },
            {
                icon: `edit`, htitle: `Edit using default SVG editor`,
                variant: ui.FLAGS.MINIMAL,
                group: `modify`
            },
            {
                icon: `clipboard-write`, htitle: `Copy glyph to clipboard`,
                variant: ui.FLAGS.MINIMAL,
                group: `file-actions`
            },
        );

        this._transformInspector = this.Add(TransformSettingsInspector, `settings`);
        this.forwardData.To(this._transformInspector, { dataMember: `transformSettings` });

        this._builder.host = ui.El(`div`, { class: `settings` }, this._host);

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
            this._flags.Set(__nullGlyph, this._data.glyph.isNull);
        }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._svgRenderer.Set(p_data);
        this.glyphInfos = p_data.glyph.unicodeInfos;
    }



}

module.exports = GlyphVariantInspectorItem;