const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

class GlyphSlotItem extends ui.WidgetItem {
    constructor() { super(); }

    static __usePaintCallback = true;

    _Init() {

        this.default_SelectOnActivation = true;

        super._Init();
        
        this._extensions.Remove(this._extDrag);
        this._notifiesSelectionStack = true;

    }

    _PostInit(){
        super._PostInit();
        this.focusArea = this;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position':'relative',
                'width':'100px',
                //'border':'1px solid gray',
                'display':'flex',
                'flex-flow':'column nowrap',
                'margin-bottom':'4px',
                'box-sizing': 'border-box'
            },
            ':host(.selected)': {
                'border':'1px solid white'
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
                'overflow':'hidden'
            },
            '.label':{
                'margin-top':'110px',
                'text-align':`center`,
                'padding':'5px'
            },
            '.placeholder':{
                'text-align':`center`,
                'font-size':'100px',
                'user-select':'none',
                'color':'rgba(255,255,255,0.05)',
                'font-family':'monospace',
                'line-height': '100%'
            },
            '.placeholder::after':{
                'content':'""',
                'width':'100%',
                'height':'1px',
                'position':'absolute',
                'background-color':'rgba(255,0,0,0.1)',
                'bottom':'23px',
                'left':'0'
            }
        }, super._Style());
    }

    _Render() {
        super._Render();
        this._svgWrapper = ui.dom.El(`div`, {class:`item box svg-ctnr`}, this._host);
        this._svgPlaceholder = new ui.manipulators.Text(ui.dom.El(`div`, {class:`item box placeholder`}, this._host), false, false);
        this._label = new ui.manipulators.Text(ui.dom.El(`div`, {class:`item label`}, this._host), false, false);
    }

    _Activ

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
        if(!this._data){ this._svgWrapper.innerHTML = ``; }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._svgWrapper.innerHTML = p_data.data.svg;
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