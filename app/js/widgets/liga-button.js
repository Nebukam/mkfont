const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;


class LigaButton extends ui.WidgetButton {
    constructor() { super(); }

    static __NFO__ = nkm.com.NFOS.Ext({
        css: [`@/buttons/button-ex.css`]
    }, ui.WidgetButton, ['css']);

    _Init() {
        super._Init();
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                '@': ['fade-in'],
                'min-height': 'auto',
                'min-width': 'auto',
                //'padding': '20px',
                'display': 'flex',
                'flex-direction': 'row',
                'padding': '5px',
                'margin-bottom': '5px',
                'align-items': `center`,
                'padding-right':`15px`,
                'padding-left':`15px`
            },
            '.item': {
                'flex': '0 0 auto',
                'margin':`3px`
            },
            '.counter': {

            },
            '.chekbox': {
                'flex': '0 0 16px',
            },
            '.long-name': {
                'flex': '1 0 auto',
                'font-family': `monospace`
            }
        }, super._Style());
    }

    _Render() {

        super._Render();

        this._checkBox = new ui.manipulators.Icon(ui.dom.El(`div`, { class: `item chekbox` }, this));
        this._checkBox.Set(`checkbox-off`);
        this._title = new ui.manipulators.Text(ui.dom.El("code", { class: "item long-name" }, this), false);
        this._title.Set("---");
        this._count = this.Attach(nkm.uilib.widgets.Tag, `item counter`);
        this._count.bgColor = `#242424`;

    }

    SetLiga(p_liga) {
        this._liga = p_liga;
        this._title.Set(p_liga.ligature, true);
        this._count.label = `×${p_liga.count}`;
        this.ToggleLiga(p_liga.export);
    }

    Activate(p_evt){
        if(!super.Activate(p_evt)){return false;}
        this.ToggleLiga();
        return false;
    }

    ToggleLiga(p_bool = null){
        this._liga.export = p_bool != null ? p_bool : !this._liga.export;
        this.Toggle(this._liga.export);
        this._checkBox.Set(`checkbox-${this._liga.export ? 'on' : 'off'}`);

        nkm.datacontrols.FindEditor(this).ToggleLiga(this._liga);
    }

}

module.exports = LigaButton;
ui.Register(`mkfont-liga-button`, LigaButton);