'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const base = ui.Widget;
class ControlHeader extends base {
    constructor() { super(); }

    static __usePaintCallback = true;
    static __defaultSelectOnActivation = true;
    static __distribute = nkm.com.helpers.OptionsDistribute.Ext()
        .To(`label`, (p_target, p_value) => { p_target._label.Set(p_value); })
        .To(`label2`, (p_target, p_value) => { p_target._label2.Set(p_value); }, null)
        .To(`htitle`, (p_target, p_value) => { p_target.htitle = p_value; });


    _Init() {
        super._Init();
        this._extensions.Remove(this._extDrag);
        this._notifiesSelectionStack = true;
    }

    set options(p_value) { this.constructor.__distribute.Update(this, p_value); }

    get editor() {
        if (this._editor) { return this._editor; }
        return nkm.datacontrols.FindEditor(this);
    }
    set editor(p_value) { this._editor = p_value; }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                //'@': ['fade-in'],
                'position': 'relative',
                'width': '100%',
                'border-bottom': '1px solid rgba(127, 127, 127, 0.1)',
                'margin-top': '2px',
                'margin': '0 2px 5px 2px',
                'display':`flex`,
                'flex-flow':`row nowrap`
            },
            '.label': {
                flex:`1 1 50%`,
                'text-transform': 'uppercase',
                'opacity': '0.5',
                'font-size': `0.65em`
            },
            '.second': {
                //'text-align':`right`
            }
            
        }, base._Style());
    }

    _Render() {

        super._Render();
        this._label = new ui.manipulators.Text(ui.dom.El(`div`, { class: `label font-xsmall` }, this._host), false, false);
        this._label2 = new ui.manipulators.Text(ui.dom.El(`div`, { class: `label second font-xsmall` }, this._host), true, false);

    }

    _CleanUp() {
        super._CleanUp();
    }

}

module.exports = ControlHeader;
ui.Register(`mkf-control-header`, ControlHeader);