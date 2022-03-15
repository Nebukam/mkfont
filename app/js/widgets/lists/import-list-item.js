const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;
const lists = nkm.uilib.lists;

const mkfData = require(`../../data`);
const GlyphCanvasRenderer = require(`../glyph-canvas-renderer`);

class ImportListItem extends lists.FolderListItem {
    constructor() { super(); }


    _Init() {
        super._Init();
    }

    _PostInit() {
        super._PostInit();
        //this.focusArea = this;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {

            },
            '.renderer':{
                'aspect-ratio':'1/1',
                'width':'50px',
                'border-radius':'3px',                
                'background-color': 'rgba(0,0,0,0.6)',
            }
        }, super._Style());
    }

    _Render() {
        this._svgRenderer = this.Add(GlyphCanvasRenderer, `renderer`, this._host);
        super._Render();
    }

    Activate(p_evt) {
        if (!super.Activate(p_evt)) { return false; }
        
        return true;
    }

    _Cleanup() {
        this._cmd = null;
        super._Cleanup();
    }

}

module.exports = ImportListItem;
ui.Register(`mkfont-import-list-item`, ImportListItem);