'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;
const operations = require(`../../operations/index`);

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);

class GlyphVariantInspectorItem extends nkm.datacontrols.ControlWidget {
    constructor() { super(); }

    static __controls = [
        { cl: mkfWidgets.ControlHeader, options: { label: `Metrics` } },
        { options: { propertyId: mkfData.IDS.WIDTH, allowOverride: true } },//, css:'helf'
        { options: { propertyId: mkfData.IDS.HEIGHT, allowOverride: true } },//, css:'helf'
        { cl: mkfWidgets.ControlHeader, options: { label: `Transformations` } },
        { cl: mkfWidgets.ControlHeader, options: { label: `Metadata` } },
        { options: { propertyId: mkfData.IDS.GLYPH_NAME } },//, css:'separator' 
    ];

    _Init() {
        super._Init();
        this._svgPaste = operations.commands.ClipboardReadSVG;

        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;

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
                'aspect-ratio': '1/1',// 'var(--preview-ratio)',
                'flex': '1 1 auto',
                'width': '100%',
                'overflow': 'hidden',
                'padding': '10px',
                'background-color': 'rgba(0,0,0,0.5)',
                'border-radius': '5px',
                'margin-bottom': '10px'
            },
            '.renderer': {
                'position': 'relative',
                'width': '100%',
                'aspect-ratio': 'var(--preview-ratio)'
            },
            '.control': {
                'flex': '1 1 auto',
                'margin-bottom': '5px'
            },
            '.toolbar': {
                'margin-bottom': '4px',
                'flex': `1 1 auto`,
                'justify-content': `center`,
            },
            '.helf': {
                'max-width': '48%'
            },
            '.separator': {
                'padding-bottom': '5px',
                'margin-bottom': '5px',
                'border-bottom': '1px solid #323232',
            }
        }, super._Style());
    }

    _Render() {
        this._previewBox = ui.dom.El(`div`, { class: `preview` }, this._host);
        this._svgRenderer = this.Add(mkfWidgets.GlyphRenderer, `renderer`, this._previewBox);
        this._dataToolbar = this.Add(ui.WidgetBar, `toolbar`, this._host);
        //this._dataToolbar.size = ui.FLAGS.SIZE_S;
        this._dataToolbar._defaultWidgetClass = nkm.uilib.buttons.Tool;

        super._Render();

        this._dataToolbar.CreateHandles(
            {
                icon: `upload`, htitle: `Import SVG`,
                group: `modify`
            },
            {
                icon: `clipboard-read`, htitle: `Import clipboard content`,
                group: `modify`
            },
            {
                icon: `edit`, htitle: `Edit using default SVG editor`,
                group: `modify`
            },
            {
                icon: `clipboard-write`, htitle: `Copy glyph to clipboard`,
                group: `file-actions`
            },
        );

    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._svgRenderer.Set(p_data);
    }

}

module.exports = GlyphVariantInspectorItem;