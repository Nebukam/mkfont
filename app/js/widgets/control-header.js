const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

class ControlHeader extends ui.Widget {
    constructor() { super(); }

    static __usePaintCallback = true;
    static __defaultSelectOnActivation = true;

    _Init() {

        super._Init();

        this._extensions.Remove(this._extDrag);
        this._notifiesSelectionStack = true;

        this._distribute = new nkm.com.helpers.OptionsDistribute();
        this._distribute.Setup(this);

        this._distribute
            .To(`label`, (p_value) => { this._label.Set(p_value); })
            .To(`htitle`, (p_value) => { this.htitle = p_value; });

    }

    set options(p_value) { this._distribute.Update(this, p_value); }

    get editor() {
        if (this._editor) { return this._editor; }
        return nkm.datacontrols.FindEditor(this);
    }
    set editor(p_value) { this._editor = p_value; }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                'width': '100%',
                'border-bottom': '1px solid rgba(127, 127, 127, 0.1)',
                'margin-top': '2px'
            },
            '.label': {
                //'border-bottom': 'rgba(127, 127, 127, 0.1)',
                //'padding-bottom':'2px',
                //'font-style':'italic'
                //'text-align':'center',
                'text-transform': 'uppercase',
                'opacity': '0.5',
            },
        }, super._Style());
    }

    _Render() {

        super._Render();
        this._label = new ui.manipulators.Text(ui.dom.El(`div`, { class: `label font-xsmall` }, this._host), false, false);

    }

    _CleanUp() {
        super._CleanUp();
    }

}

module.exports = ControlHeader;
ui.Register(`mkfont-control-header`, ControlHeader);