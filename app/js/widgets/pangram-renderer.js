/*const nkm = require(`@nkmjs/core`);*/
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
        this.align = null;

        this._Bind(this.Draw);
        this._scheduledDraw = nkm.com.DelayedCall(this.Draw, 500);

    }

    _PostInit(){
        super._PostInit();
        this.align = `left`;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                'display': 'flex',
                'box-sizing':'border-box',
                'flex-flow': 'column nowrap',
                //'align-items':'center',
                'justify-content':'center',
                'padding':'20px',
                'overflow':'clip',
                '--font-size':'40px',
                'background-color': '#1e1e1e',
                'border-radius':'5px'
            },
            '.pangram': {
                'font-family': `'tempFont'`,
                'text-align': 'var(--font-align)',
                'font-size': 'var(--font-size)',
                'color':'var(--glyph-color)'
            },
            '.paninput':{
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

    set align(p_value){
        if(!p_value){ p_value = `center`; }
        this.style.setProperty(`--font-align`, p_value);
    }

    set direction(p_value){
        if(!p_value){
            this.style.removeProperty(`direction`);
        }else{
            this.style.setProperty(`direction`, p_value);
        }
        
    }

    set text(p_value) {
        if (!p_value) { p_value = defaultPangram; }
        
        this._previewText = p_value;
        let val = '<p>' + p_value.replace(/[^\S\n]+\n/g, '\n').replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
        this._pangramText.Set(val);
    }

    set fontSize(p_value){
        this.style.setProperty(`--font-size`, `${p_value}px`);
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._scheduledDraw.Schedule();
    }

    Draw() {

        let subFamily = this._data;
        let ttf = svg2ttf(subFamily.fontObject.outerHTML, {});

        //console.log(subFamily.fontObject.outerHTML);

        let base64 = u.tils.BytesToBase64(ttf.buffer);

        if (this._tempFont) { document.fonts.delete(this._tempFont); }
        this._tempFont = new FontFace('tempFont', `url(data:application/octet-stream;charset=utf-8;base64,${base64}) format('truetype')`);
        document.fonts.add(this._tempFont);

    }

    _CleanUp() {
        this.catalog = null;
        super._CleanUp();
    }

}

module.exports = PangramRenderer;
ui.Register(`mkfont-pangram`, PangramRenderer);