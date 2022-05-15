'use strict';

const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const u = nkm.u;
const ui = nkm.ui;

const defaultPangram = `By Jove, my quick study of lexicography won a prize!`;

const base = ui.Widget;
class PangramRenderer extends base {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._pointer
            .Hook(ui.POINTER.MOUSE_LEFT, ui.POINTER.DOWN, this._Bind(this._StartSelection))
            .Hook(ui.POINTER.MOUSE_LEFT, ui.POINTER.RELEASE, this._Bind(this._EndSelection));

        this._ongoingSelection = false;
        this._highlightList = null;
    }

    _PostInit() {
        super._PostInit();
        this.align = `left`;
        this.focusArea = this;
    }

    static _Style() {
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
                'line-height': 'var(--line-height)',
                'font-size': 'var(--font-size)',
                'color': 'var(--glyph-color)',
                'text-transform': 'var(--case)',
                'word-break': `break-word`,
            },
            '.paninput': {
                '-webkit-appearance': `none`,
                'appearance': `none`,
                'background-color': 'rgba(0,0,0,0)',
                'border': 'none',
            },
            '.high': {
                'color': `white`,
                'background-color': `rgba(var(--col-active-dark-rgb), 0.8)`,
                'border-radius': `2px`,
            }
        }, base._Style());
    }

    _Render() {
        super._Render();
        this._fontEmbed = ui.dom.El(`style`, {}, this._host);
        this._pangramText = new ui.manipulators.Text(ui.dom.El(`div`, { class: `pangram` }, this._host));
        this.text = null;
    }

    _OnDataUpdated(p_data) {
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
        this._ParseHighlights();
    }

    set fontSize(p_value) { this.style.setProperty(`--font-size`, `${p_value}px`); }

    set lineHeight(p_value) { this.style.setProperty(`--line-height`, `${p_value}em`); }

    set case(p_value) { this.style.setProperty(`--case`, `${p_value}`); }


    set highlightList(p_list) {
        this._highlightList = p_list;
        if (p_list) { p_list.sort(); }
        this._ParseHighlights();
    }

    _ParseHighlights() {
        let
            val = this._previewText,
            valSpan = val;

        if (this._highlightList) {
            valSpan = ``;
            for (let i = 0, n = val.length; i < n; i++) {
                let letter = val.substring(i, i + 1);
                if (this._highlightList.includes(letter)) { valSpan += `<span class="high">${letter}</span>`; }
                else { valSpan += letter; }
            }
        }
        val = '<p>' + valSpan.replace(/[^\S\n]+\n/g, '\n').replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
        this._pangramText.Set(val);
    }

    //#region Interactive selection

    _OnPaintChange() {
        super._OnPaintChange();
        if (!this._isPainted) { this._ongoingSelection = false; }
    }

    _StartSelection() {
        if (this._ongoingSelection) { return; }
        this._ongoingSelection = true;
    }

    _EndSelection() {
        if (!this._ongoingSelection) { return; }
        this._ongoingSelection = false;
        let text = ui.dom.highlightedText;
        if (!text || text.length == 0) { return; }
        this.Broadcast(nkm.com.SIGNAL.VALUE_CHANGED, text);
    }

    //#endregion

}

module.exports = PangramRenderer;
ui.Register(`mkf-pangram`, PangramRenderer);