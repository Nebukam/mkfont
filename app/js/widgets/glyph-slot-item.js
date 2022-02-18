const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const GlyphRenderer = require(`./glyph-renderer`);

class GlyphSlotItem extends ui.WidgetItem {
    constructor() { super(); }

    static __usePaintCallback = true;

    _Init() {

        this.default_SelectOnActivation = true;

        super._Init();

        this._extensions.Remove(this._extDrag);
        this._notifiesSelectionStack = true;

    }

    _PostInit() {
        super._PostInit();
        this.focusArea = this;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                'min-height': 'var(--preview-size)',
                //'border':'1px solid gray',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'margin-bottom': '4px',
                'box-sizing': 'border-box',
                'padding':'10px',
                'border-radius':'5px',
                'background-color': 'rgba(0,0,0,0.25)',
                '--preview-size-x':'var(--preview-size)'
            },
            ':host(.selected)': {
                'background-color': 'rgba(127,127,127,0.25)'
            },
            ':host(.unpainted) .box':{ 'display':'none' },
            '.preview':{
                'position':'relative',
                'aspect-ratio':'var(--preview-ratio)',
                'flex': '1 1 auto',
                'height': 'var(--preview-size)',
                'min-height': 'var(--preview-size)',
                'max-height': 'var(--preview-size)',
                'overflow': 'hidden'
            },
            '.box, svg': {
                'height': '100%',
                'aspect-ratio':'var(--preview-ratio)',
                'position': 'absolute',
            },
            '.svg-ctnr': {
                //'border': '1px solid gray',
            },
            '.label': {
                'margin-top': '10px',
                'text-align': `center`,
                'padding': '5px'
            },
            'pre':{
                'margin':'0',
                'font-size':'large',
                'user-select':'text'
            },
            '.placeholder': {
                'text-align': `center`,
                'font-size': 'var(--preview-size)',
                'user-select': 'none',
                'color': 'rgba(255,255,255,0.05)',
                'font-family': 'monospace',
                'line-height': '100%'
            },
        }, super._Style());
    }

    _Render() {
        super._Render();
        
        this._previewBox = ui.dom.El(`div`, { class: `preview` }, this._host);
        
        this._glyphRender = this.Add(GlyphRenderer, `box renderer`, this._previewBox);
        this._svgBox = ui.dom.El(`div`, { class: `box svg-ctnr` }, this._previewBox);        
        this._glyphBox = new ui.manipulators.Text(ui.dom.El(`div`, { class: `box placeholder` }, this._previewBox), false, false);
        //this._linesBox = ui.dom.El(`div`, { class: `box lines` }, this._previewWrapper);

        this._svgNode = null;

        this._label = new ui.manipulators.Text(ui.dom.El(`div`, { class: `item label` }, this._host), false, false);


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
        let glyph = this._data._options.unicode;
        this._glyphBox.Set(glyph);
        this._label.Set(`<pre>${glyph}</pre>`); //this._data._options.hex

        this._UpdateSVGNode(this._data ? this._data.data.svg : null);
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._UpdateSVGNode(p_data.data.svg);
        this._glyphRender.Set(p_data.data);
    }

    _UpdateSVGNode(p_svg = null) {

        if (this._svgNode) {
            this._svgNode.remove();
            this._svgNode = null;
        }

        if (!p_svg) { 
            delete this._glyphBox._element.style.display;
            return; 
        }else{
            this._glyphBox._element.style.display = `none`;
        }

        this._svgNode = p_svg.cloneNode(true);
        this._svgBox.appendChild(this._svgNode);

    }

    _ToClipboard() {
        navigator.clipboard.writeText(this._data._options.glyph);
    }

    _Cleanup() {
        super._Cleanup();
    }

}

module.exports = GlyphSlotItem;
ui.Register(`mkfont-glyph-slot`, GlyphSlotItem);