const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

class GlyphSlotItem extends ui.WidgetItem {
    constructor() { super(); }

    static __usePaintCallback = true;

    _Init() {

        super._Init();
        
        this._extensions.Remove(this._extDrag);

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position':'relative',
                'width':'100px',
                //'border':'1px solid gray',
                'display':'flex',
                'flex-flow':'column nowrap',
                'margin-bottom':'4px'
            },
            '.box':{
                'width':'100px',
                'height':'100px',
                'position':'absolute'
            },
            '.item':{
                'flex':'1 1 auto'
            },
            '.svg-ctnr':{
                'border':'1px solid gray',
            },
            '.label':{
                'margin-top':'110px',
                'text-align':`center`,
                'padding':'5px'
            },
            '.placeholder':{
                'text-align':`center`,
                'font-size':'50px',
                'user-select':'none',
                'opacity':'0.1'
            }
        }, super._Style());
    }

    _Render() {
        super._Render();
        this._svgWrapper = ui.dom.El(`div`, {class:`item box svg-ctnr`}, this._host);
        this._svgPlaceholder = new ui.manipulators.Text(ui.dom.El(`div`, {class:`item box placeholder`}, this._host), false, false);
        this._label = new ui.manipulators.Text(ui.dom.El(`div`, {class:`item label`}, this._host), false, false);
    }

    _OnPaintChange() {
        super._OnPaintChange();
        if (this._isPainted) {
            //this.style.opacity = 1;
        } else {
            //this.style.opacity = 0;
        }
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        this._label.Set(`<b>${this._data._options.glyph}</b> <i>${this._data._options.hex}</i>`);
        this._svgPlaceholder.Set(this._data._options.glyph);
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);

    }

    _ToClipboard(){
        navigator.clipboard.writeText(this._data._options.glyph);
    }

    _Cleanup() {
        super._Cleanup();
    }

}

module.exports = GlyphSlotItem;
ui.Register(`mkfont-glyph-slot`, GlyphSlotItem);