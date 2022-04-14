const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const u = nkm.u;
const ui = nkm.ui;

const defaultPangram = `By Jove, my quick study of lexicography won a prize!`;

class PangramRenderer extends ui.Widget {
    constructor() { super(); }

    _PostInit() {
        super._PostInit();
        this.align = `left`;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                'display': 'flex',
                'box-sizing': 'border-box',
                'flex-flow': 'column nowrap',
                //'align-items':'center',
                'justify-content': 'center',
                'padding': '20px',
                'overflow': 'clip',
                '--font-size': '40px',
                '--case': 'none',
                'background-color': '#1e1e1e',
                'border-radius': '5px'
            },
            '.pangram': {
                'text-align': 'var(--font-align)',
                'font-size': 'var(--font-size)',
                'color': 'var(--glyph-color)',
                'text-transform': 'var(--case)'
            },
            '.paninput': {
                '-webkit-appearance': `none`,
                'appearance': `none`,
                'background-color': 'rgba(0,0,0,0)',
                'border': 'none',
            }
        }, super._Style());
    }

    _Render() {
        super._Render();
        this._fontEmbed = ui.dom.El(`style`, {}, this._host);
        this._pangramText = new ui.manipulators.Text(ui.dom.El(`div`, { class: `pangram` }, this._host));
        this.text = null;
    }

    _OnDataUpdated(p_data){
        super._OnDataUpdated(p_data);
        this._pangramText._element.style.setProperty('font-family', `'${p_data._fontCache.uuid}'`);
    }

    set align(p_value) {
        if (!p_value) { p_value = `center`; }
        this.style.setProperty(`--font-align`, p_value);
    }

    set direction(p_value) {
        if (!p_value) { this.style.removeProperty(`direction`); }
        else { this.style.setProperty(`direction`, p_value); }
    }

    set text(p_value) {
        if (!p_value) { p_value = defaultPangram; }

        this._previewText = p_value;
        let val = '<p>' + p_value.replace(/[^\S\n]+\n/g, '\n').replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
        this._pangramText.Set(val);
    }

    set fontSize(p_value) { this.style.setProperty(`--font-size`, `${p_value}px`); }

    set case(p_value) { this.style.setProperty(`--case`, `${p_value}`); }

}

module.exports = PangramRenderer;
ui.Register(`mkfont-pangram`, PangramRenderer);