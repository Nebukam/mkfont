const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const svgpath = require('svgpath');

const mkfData = require(`../data`);
const mkfInspectors = require(`../editors/inspectors`);
const mkfWidgets = require(`../widgets`);

class SingleImportPreview extends ui.views.View {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._transformedData = null;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'grid',
                'flex-flow': 'column wrap',
                'flex': '0 0 auto',
                'grid-template-columns': 'max-content max-content',
                'grid-template-rows': '80px',
                'grid-gap': '10px'
            },
            '.item': {
                'flex': '1 0 auto',
                'grid-column-start': '1',
            },
            '.preview': {
                'position': 'relative',
                'aspect-ratio': '1/1',
                'width': '420px',
                'overflow': 'hidden',
                //'padding': '10px',
                'background-color': 'rgba(0,0,0,0.6)',
                'border-radius': '5px',
                'grid-column-start': '2',
                'grid-row': '1 / span 2',
            },
            '.settings':{
                'width':'300px'
            },
            '.renderer': {
                'position': 'relative',
                'width': '100%',
                'aspect-ratio': '1/1',
                'flex': '0 0 100%'
            },
            '.identity': {
                'width': '100%'
            }
        }, super._Style());
    }

    _Render() {
        super._Render();

        this._identity = this.Attach(mkfWidgets.GlyphIdentity, `item identity`, this._host);
        this._settingsInspector = this.Attach(mkfInspectors.TransformSettings, `item settings`);
        this.forwardData.To(this._settingsInspector);

        this._previewBox = ui.dom.El(`div`, { class: `item preview` }, this._host);

        this._glyphRenderer = this.Attach(mkfWidgets.GlyphCanvasRenderer, `item renderer`, this._previewBox);
        this._glyphRenderer.options = {
            drawGuides: true,
            drawLabels: true,
            centered: false,
        };

    }

    set subFamily(p_value) {
        this._contextInfos = p_value ? p_value._contextInfos : null;
        this._glyphRenderer.contextInfos = this._contextInfos;
    }

    set glyphInfos(p_value) {
        this._glyphInfos = p_value;
        this._identity.glyphInfos = p_value;
    }

    set importedGlyph(p_value) {
        this._importedGlyph = p_value;
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._glyphRenderer.drawHorAxis = p_data.Get(mkfData.IDS.TR_VER_ALIGN).value == 2;
        this._glyphRenderer.drawVerAxis = p_data.Get(mkfData.IDS.TR_HOR_ALIGN).value != 0;
        this._UpdatePathTransforms();
    }

    _UpdatePathTransforms() {

        if (!this._importedGlyph) { this._transformedPath = null; return; }

        this._transformedData = SVGOPS.FitPath(this._data, this._contextInfos, this._importedGlyph);
        this._glyphRenderer.glyphWidth = this._transformedData.width; 
        this._glyphRenderer.glyphPath = this._transformedData.path;
        this._glyphRenderer.Draw();

    }

}

module.exports = SingleImportPreview;
ui.Register(`mkfont-single-tr-preview`, SingleImportPreview);