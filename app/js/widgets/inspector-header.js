const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const base = ui.Widget;
class InspectorHeader extends base {
    constructor() { super(); }

    static __usePaintCallback = true;
    static __distribute = nkm.com.helpers.OptionsDistribute.Ext()
        .To(`title`, (p_target, p_value) => { p_target._title.Set(p_value); })
        .To(`icon`, (p_target, p_value) => { p_target._icon.Set(p_value); });

    set options(p_value) { this.constructor.__distribute.Update(this, p_value); }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                'height': '20px',
                'min-height': '20px',
                'width': 'calc(100% - 20px)',
                'border-bottom': '1px solid rgba(127, 127, 127, 0.1)',
                'margin-top': '2px',
                'padding': `10px`,
                'overflow': `clip`
            },
            '.title': {
                'text-transform': 'uppercase',
                'opacity': '0.5',
            },
            '.ico': {
                'position': 'absolute',
                'transform': 'scale(1.2) rotate(15deg) translateY(-10px)',
                'width': '50px',
                'right': `0`,
                'opacity': '0.1'
            }
        }, base._Style());
    }

    _Render() {

        super._Render();
        this._icon = new ui.manipulators.Icon(ui.dom.El(`div`, { class: `ico` }, this._host), false, false);
        this._title = new ui.manipulators.Text(ui.dom.El(`div`, { class: `title` }, this._host), false, false);

    }

    _CleanUp() {
        super._CleanUp();
    }

}

module.exports = InspectorHeader;
ui.Register(`mkf-inspector-header`, InspectorHeader);