const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const u = nkm.utils;
const ui = nkm.ui;

const mkfData = require(`../data`);

const svg2ttf = require('svg2ttf');

const defaultPangram = `By Jove, my quick study of lexicography won a prize!`;

class PangramRenderer extends ui.Widget {
    constructor() { super(); }

    _Init() {

        super._Init();

        this._previewText = defaultPangram;
        this._tempFont = null;

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                'display': 'flex',
                'flex-flow': 'column nowrap'
            },
            '.pangram': {
                'font-family': `'fontello'`,
                'text-align': 'center',
                'font-size': '3em'
            }
        }, super._Style());
    }

    _Render() {
        super._Render();
        this._fontEmbed = ui.dom.El(`style`, {}, this._host);
        this._pangramText = new ui.manipulators.Text(ui.dom.El(`span`, { class: `pangram` }, this._host));
        this.text = null;

    }

    set text(p_value) {
        if (!p_value) { p_value = defaultPangram; }
        this._previewText = p_value;
        this._pangramText.Set(p_value);
    }

    _OnDataUpdated(p_data) {
        
        super._OnDataUpdated(p_data);

        // Bake font
        console.log(p_data.xml);
        let ttf = svg2ttf(p_data.xml.outerHTML, {});

        let base64 =  u.tils.BytesToBase64(ttf.buffer);

        if(this._tempFont){document.fonts.delete(this._tempFont);}
        this._tempFont = new FontFace('fontello', `url(data:application/octet-stream;charset=utf-8;base64,${base64}) format('truetype')`);
        document.fonts.add(this._tempFont);

    }

    _CleanUp() {
        this.catalog = null;
        super._CleanUp();
    }

}

module.exports = PangramRenderer;
ui.Register(`mkfont-font-group`, PangramRenderer);