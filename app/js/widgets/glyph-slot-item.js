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

    _PostInit() {
        super._PostInit();
        this.focusArea = this;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                'min-width': 'var(--preview-size)',
                'min-height': 'var(--preview-size)',
                //'border':'1px solid gray',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'margin-bottom': '4px',
                'box-sizing': 'border-box',
                'padding':'10px',
                'border-radius':'5px',
                'background-color': 'rgba(0,0,0,0.25)'
            },
            ':host(.selected)': {
                'background-color': 'rgba(127,127,127,0.25)'
            },
            '.preview':{
                'position':'relative',
                'flex': '1 1 auto',
                'width': 'var(--preview-size)',
                'height': 'var(--preview-size)',
                'min-width': 'var(--preview-size)',
                'min-height': 'var(--preview-size)',
            },
            '.box': {
                'width': '100%',
                'height': '100%',
                'position': 'absolute'
            },
            '.svg-ctnr': {
                //'border': '1px solid gray',
                'overflow': 'hidden'
            },
            '.label': {
                'margin-top': '10px',
                'text-align': `center`,
                'padding': '5px'
            },
            '.placeholder': {
                'text-align': `center`,
                'font-size': 'var(--preview-size)',
                'user-select': 'none',
                'color': 'rgba(255,255,255,0.05)',
                'font-family': 'monospace',
                'line-height': '100%'
            },
            '.placeholder::after': {
                'content': '""',
                'width': '100%',
                'height': '1px',
                'position': 'absolute',
                'background-color': 'rgba(255,0,0,0.1)',
                'bottom': '23px',
                'left': '0'
            }
        }, super._Style());
    }

    _Render() {
        super._Render();
        
        this._previewWrapper = ui.dom.El(`div`, { class: `preview` }, this._host);
        this._svgBox = ui.dom.El(`div`, { class: `box svg-ctnr` }, this._previewWrapper);
        this._glyphBox = new ui.manipulators.Text(ui.dom.El(`div`, { class: `box placeholder` }, this._previewWrapper), false, false);
        //this._linesBox = ui.dom.El(`div`, { class: `box lines` }, this._previewWrapper);

        this._svgNode = null;

        this._label = new ui.manipulators.Text(ui.dom.El(`div`, { class: `item label` }, this._host), false, false);

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
        let glyph = this._data._options.glyph;
        this._glyphBox.Set(glyph);
        this._label.Set(`<b>${glyph}</b> <i>${glyph.charCodeAt(0)}</i>`); //this._data._options.hex

        this._UpdateSVGNode(this._data ? this._data.data.svg : null);
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._UpdateSVGNode(p_data.data.svg);
    }

    _UpdateSVGNode(p_svg = null) {
        if (this._svgNode) {
            this._svgNode.remove();
            this._svgNode = null;
        }

        if (!p_svg) { return; }

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