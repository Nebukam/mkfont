'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const base = nkm.datacontrols.ControlWidget;
class ResourceBinding extends base {
    constructor() { super(); }

    static __NFO__ = nkm.com.NFOS.Ext({
        css: [`@/buttons/button-ex.css`]
    }, base, ['css']);

    _Init() {
        super._Init();
        //this._dataObserver.Hook()
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                ...nkm.style.rules.fadeIn,
                ...nkm.style.flex.row.nowrap,
                ...nkm.style.flex.align.center.cross,
                'min-height': 'auto',
                //'padding': '20px',
                'padding': '5px',
                'margin-bottom': '5px',
            },
            '.item': {
                ...nkm.style.flexItem.fixed,
                'margin': `3px`,
                'user-select': 'none'
            },
            '.counter': {

            },
            '.checkbox': {
                'flex': '0 0 16px',
            },
            '.label': {
                ...nkm.style.flexItem.fill,
                'direction': 'rtl'
            },
            '.btn': {
                'margin': '3px'
            }
        }, base._Style());
    }

    _Render() {

        this.classList.add(`loading`);

        super._Render();

        this._icon = new ui.manipulators.Icon(ui.dom.El(`div`, { class: `item checkbox` }, this));
        this._icon.Set(`document-link`);

        this._fileName = new ui.manipulators.Text(ui.dom.El(`code`, { class: "item label" }, this), false);
        this._fileName.Set("resource.ext");
        this._fileName.ellipsis = true;

        this._btnRemove = this.Attach(nkm.uilib.buttons.Tool, `btn`);
        this._btnRemove.options = {
            icon: `remove`, size: nkm.ui.FLAGS.SIZE_XS,
            variant: ui.FLAGS.FRAME, flavor: nkm.com.FLAGS.ERROR,
            trigger: { fn: () => { if (this._data && this._data.currentRsc) { this._data.currentRsc.Release(); } } }
        }

    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        if (this._data) {
            this.visible = this._data ? true : false;
            this._fileName.Set(this._data.path);
        } else {
            this.visible = false;
        }
    }

}

module.exports = ResourceBinding;
ui.Register(`mkf-resource-binding`, ResourceBinding);