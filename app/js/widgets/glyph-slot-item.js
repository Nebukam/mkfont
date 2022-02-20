const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const mkfData = require(`../data`);
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

    get editor() { return nkm.datacontrols.FindEditor(this); }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                //'min-height': 'var(--preview-size)',
                //'border':'1px solid gray',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                'margin-bottom': '4px',
                'box-sizing': 'border-box',
                'padding': '10px',
                'border-radius': '5px',
                'background-color': 'rgba(0,0,0,0.25)',
                '--preview-size-x': 'var(--preview-size)',
                'align-items': 'center',                
                'overflow': 'clip',
            },
            ':host(.selected)': {
                'background-color': 'rgba(127,127,127,0.25)'
            },
            ':host(.unpainted) .box': { 'display': 'none' },
            '.preview': {
                'position': 'relative',
                'aspect-ratio': 'var(--preview-ratio)',
                'flex': '1 1 auto',
                //'height': 'var(--preview-size)',
                'min-height': 'var(--preview-size)',
                //'max-height': 'var(--preview-size)',
                'min-width': 'var(--preview-size)',
                'display': 'flex',
                'flex-flow': 'row nowrap',
                'justify-content': 'center',                
                'max-height':'calc( var(--preview-size) * 1.8 )',
                'overflow-y': 'clip'
            },
            '.box': {
                'height': '100%',
                //'aspect-ratio': 'var(--preview-ratio)',
                'position': 'absolute',
            },
            '.label': {
                'margin-top': '10px',
                'text-align': `center`,
                'padding': '5px'
            },
            'pre': {
                'margin': '0',
                'font-size': 'large',
                'user-select': 'text'
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

        this._glyphPlaceholder = new ui.manipulators.Text(ui.dom.El(`div`, { class: `box placeholder` }, this._previewBox), false, false);
        this._glyphRender = this.Add(GlyphRenderer, `box renderer`, this._previewBox);

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

    _OnDataUpdated(p_data) {

        super._OnDataUpdated(p_data);
        let glyphData = p_data.data;
        let unicode = glyphData.Get(mkfData.IDS.UNICODE);
        this._glyphPlaceholder.Set(unicode);
        this._label.Set(`<pre>${unicode}</pre>`);

        if (glyphData.Get(mkfData.IDS.PATH)) {
            this._glyphPlaceholder._element.style.display = `none`;
        } else {
            delete this._glyphPlaceholder._element.style.display;
        }

        this._UpdateGlyphPreview();

    }

    _UpdateGlyphPreview(p_variant) {
        let glyphData = this._data ? this._data.data : null;
        if (!glyphData) { this._glyphRender.Set(null); }
        this._glyphRender.Set(glyphData.GetVariant(glyphData.family.selectedSubFamily));
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