'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const base = ui.WidgetButton;
class LigaButton extends base {
    constructor() { super(); }

    static __NFO__ = nkm.com.NFOS.Ext({
        css: [`@/buttons/button-ex.css`]
    }, base, ['css']);

    _Init() {
        super._Init();
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                ...nkm.style.rules.fadeIn,
                ...nkm.style.flex.row.nowrap,
                ...nkm.style.flex.align.center.all,
                'min-height': 'auto',
                'min-width': 'auto',
                //'padding': '20px',
                'padding': '5px',
                'margin-bottom': '5px',
                'padding-right': `15px`,
                'padding-left': `15px`
            },
            '.item': {
                ...nkm.style.flexItem.fixed,
                'margin': `3px`
            },
            '.counter': {

            },
            '.chekbox': {
                'flex': '0 0 16px',
            },
            '.long-name': {
                ...nkm.style.flexItem.grow,
                'font-family': `monospace`
            }
        }, base._Style());
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

    Activate(p_evt) {
        if (!super.Activate(p_evt)) { return false; }
        this.ToggleLiga();
        return false;
    }

    ToggleLiga(p_bool = null) {
        this._liga.export = p_bool != null ? p_bool : !this._liga.export;
        this.Toggle(this._liga.export);
        this._checkBox.Set(`checkbox-${this._liga.export ? 'on' : 'off'}`);

        nkm.datacontrols.FindEditor(this).ToggleLiga(this._liga);
    }

}

module.exports = LigaButton;
ui.Register(`mkf-liga-button`, LigaButton);