/*const nkm = require(`@nkmjs/core`);*/
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
        this._transformedPath = null;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display':'grid',
                'flex-flow':'column wrap',
                'flex':'0 0 auto',
                'grid-template-columns':'max-content max-content',
                'grid-template-rows':'80px',
                'grid-gap':'10px'
            },
            '.item':{
                'flex':'1 0 auto',
                'grid-column-start': '1',
            },
            '.preview': {
                'position': 'relative',
                'aspect-ratio': '1/1',
                'width': '350px',
                'overflow': 'hidden',
                'padding': '10px',
                'background-color': 'rgba(0,0,0,0.5)',
                'border-radius': '5px',
                'grid-column-start': '2',
                'grid-row': '1 / span 2',
            },
            '.renderer': {
                'position': 'relative',
                'width': '100%',
                'aspect-ratio': '1/1',
                'flex':'0 0 100%'
            },
            '.identity':{
                'width':'100%'
            }
        }, super._Style());
    }

    _Render(){
        super._Render();

        this._identity = this.Add(mkfWidgets.GlyphIdentity, `item identity`, this._host);
        this._settingsInspector = this.Add(mkfInspectors.ImportSettings, `item settings`);
        this.forwardData.To(this._settingsInspector);

        this._previewBox = ui.dom.El(`div`, { class: `item preview` }, this._host);

        this._svgRenderer = this.Add(mkfWidgets.GlyphCanvasRenderer, `item renderer`, this._previewBox);
        this._svgRenderer.drawGuides = true;
        this._svgRenderer.centered = false;

    }

    set subFamily(p_value){
        this._svgRenderer.previewInfos = p_value ? p_value._previewInfos : null;
    }

    set glyphInfos(p_value){
        this._glyphInfos = p_value;
        this._identity.glyphInfos = p_value;
    }

    set importedGlyph(p_value){
        this._importedGlyph = p_value;
        this._transformedPath = p_value;        
    }

    _OnDataUpdated(p_data){
        super._OnDataUpdated(p_data);        
        this._UpdatePathTransforms();
    }

    _UpdatePathTransforms(){
        
        if(!this._importedGlyph){ this._transformedPath = null; return; }

        console.log(this._data);

        let scale = this._data.Get(mkfData.IDS.IMPORT_SCALE_FACTOR);
        console.log(scale);
        this._transformedPath = svgpath(this._importedGlyph.path).scale(scale,scale).toString();
        console.log(this._transformedPath);
        this._svgRenderer.glyphPath = this._transformedPath;
        this._svgRenderer.Draw();

    }

}

module.exports = SingleImportPreview;
ui.Register(`mkfont-single-import-preview`, SingleImportPreview);