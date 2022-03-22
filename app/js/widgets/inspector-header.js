const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

class InspectorHeader extends ui.Widget {
    constructor() { super(); }

    static __usePaintCallback = true;

    _Init() {

        super._Init();

        this._distribute = new nkm.com.helpers.OptionsDistribute();
        this._distribute.Setup(this);

        this._distribute
            .To(`title`, (p_value) => { this._title.Set(p_value); })
            .To(`icon`, (p_value) => { this._icon.Set(p_value); });

    }

    set options(p_value){ this._distribute.Update(this, p_value); }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                'height':'20px',
                'min-height':'20px',
                'width': 'calc(100% - 20px)',
                'border-bottom': '1px solid rgba(127, 127, 127, 0.1)',
                'margin-top':'2px',
                'padding':`10px`,
                'overflow':`clip`
            },
            '.title': {
                'text-transform':'uppercase',
                'opacity':'0.5',
            },
            '.ico':{
                'position': 'absolute',
                'transform':'scale(1.2) rotate(15deg) translateY(-10px)',
                'width':'50px',
                'right':`0`,
                'opacity':'0.1'
            }
        }, super._Style());
    }

    _Render() {

        super._Render();
        this._icon = new ui.manipulators.Icon(ui.dom.El(`div`, { class: `ico` }, this._host), false, false);
        this._title = new ui.manipulators.Text(ui.dom.El(`div`, { class: `title` }, this._host), false, false);

    }

    _Cleanup() {
        super._Cleanup();
    }

}

module.exports = InspectorHeader;
ui.Register(`mkfont-inspector-header`, InspectorHeader);