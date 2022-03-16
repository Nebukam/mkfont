const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const svgpath = require('svgpath');

const mkfData = require(`../data`);
const mkfInspectors = require(`./inspectors`);
const mkfWidgets = require(`../widgets`);

class EditorListImport extends nkm.datacontrols.Editor {
    constructor() { super(); }

    _Init() {
        super._Init();
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'grid',
                'flex-flow': 'column wrap',
                'flex': '0 0 auto',
                'grid-template-columns': 'max-content max-content max-content',
                'grid-template-rows': '80px auto',
                'grid-gap': '10px'
            },
            '.item': {
                'flex': '1 0 auto',
                'grid-column-start': '1',
            },
            '.list': {
                'position': 'relative',
                'height': '0',
                'width': '350px',
                'overflow': 'hidden',
                //'padding': '10px',
                'background-color': 'rgba(0,0,0,0.2)',
                'grid-column-start': '2',
                'grid-row': '1 / span 2',
                'overflow':'auto',
                'min-height':'100%',
            },
            '.settings': {
                'width': '300px'
            },
            '.preview': {
                'position': 'relative',
                'width': '400px',
                'height': '100%',
                //'aspect-ratio': '1/1',
                'flex': '0 0 100%',                
                'background-color': '#1b1b1b',
                'border-radius':'3px', 
                'grid-column-start': '3',
                'grid-row': '1 / span 2',
            },
            '.identity': {
                'width': '100%'
            },
            '.header':{
                'height':'50px'
            }
        }, super._Style());
    }

    _Render() {
        super._Render();

        this._header = ui.El(`div`, {class:`item header`}, this._host);

        this._settingsInspector = this.Add(mkfInspectors.TransformSettings, `item settings`);
        this.forwardData.To(this._settingsInspector);

        this._importListBrowser = this.Add(mkfWidgets.lists.ImportListRoot, `list`, this._host);

        this._glyphRenderer = this.Add(mkfWidgets.GlyphCanvasRenderer, `preview`, this._host);
        this._glyphRenderer.options = {
            drawGuides: true,
            drawLabels: true,
            centered: false,
        };
    }

    set subFamily(p_value) {
        this._subFamily = p_value;
    }

    set catalog(p_value) {
        console.log(p_value);
        this._importListBrowser.data = p_value;
    }

    _OnInspectedDataChanged(p_oldData){
        super._OnInspectedDataChanged(p_oldData);
        if(this._inspectedData){ this._UpdatePreview(); }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        if(this._inspectedData){ this._UpdatePreview(); }
    }

    _UpdatePreview(){

        let subFamily = this._inspectedData.GetOption(`subFamily`),
            contextInfos = subFamily._contextInfos,
            pathData = this._inspectedData.GetOption(`svgStats`),
            transformedPath = SVGOPS.FitPath(
                this._data,
                contextInfos,
                pathData
            );

        this._glyphRenderer.contextInfos = contextInfos;
        this._glyphRenderer.glyphWidth = transformedPath.width;
        this._glyphRenderer.glyphPath = transformedPath.path;
        this._glyphRenderer.Draw();
    }

}

module.exports = EditorListImport;
ui.Register(`mkfont-list-import-editor`, EditorListImport);