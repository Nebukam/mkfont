const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const base = ui.Widget;
class ResourceBinding extends base {
    constructor() { super(); }

    _Init() {
        super._Init();
    }

    static _Style() {
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
        }, base._Style());
    }

    _Render() {

        super._Render();

        this._icon = new ui.manipulators.Icon(ui.dom.El(`div`, { class: `item chekbox` }, this));
        this._icon.Set(`checkbox-off`);

        this._fileName = new ui.manipulators.Text(ui.dom.El(`code`, { class: "item long-name" }, this), false);
        this._fileName.Set("---");

        this._btnLocate = this.Add(nkm.uilib.buttons.Tool, `btn`);
        this._btnLocate.options = {
            icon:`document-search`
        }

        this._btnRemove = this.Add(nkm.uilib.buttons.Tool, `btn`);
        this._btnLocate.options = {
            icon:`remove`
        }

    }

    SetLiga(p_liga) {
        this._liga = p_liga;
        this._fileName.Set(p_liga.ligature, true);
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
        this._icon.Set(`checkbox-${this._liga.export ? 'on' : 'off'}`);

        nkm.datacontrols.FindEditor(this).ToggleLiga(this._liga);
    }

}

module.exports = ResourceBinding;
ui.Register(`mkfont-resource-binding`, ResourceBinding);