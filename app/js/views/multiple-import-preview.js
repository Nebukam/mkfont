const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const svgpath = require('svgpath');

const mkfData = require(`../data`);
const mkfInspectors = require(`../editors/inspectors`);
const mkfWidgets = require(`../widgets`);

class MultipleImportPreview extends ui.views.View {
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
                'background-color': 'rgba(0,0,0,0.6)',
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

        this._svgRenderer = this.Add(mkfWidgets.GlyphCanvasRenderer, `preview`, this._host);
    }

    set subFamily(p_value) {
        this._subFamily = p_value;
    }

    set catalog(p_value) {
        console.log(p_value);
        this._importListBrowser.data = p_value;
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
    }

}

module.exports = MultipleImportPreview;
ui.Register(`mkfont-multiple-import-preview`, MultipleImportPreview);