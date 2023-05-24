'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;
const lists = nkm.uilib.lists;

const mkfData = require(`../../data`);

const base = lists.FolderListItem;
class CatItem extends base {
    constructor() { super(); }

    static __draggable = false;

    _Init() {
        super._Init();
        this._extensions.Remove(this._extDrag);
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {

            },
            '.cat-hint': {
                ...nkm.style.rules.pos.abs,
                'width': '4px',
                'height': '4px',
                'border-radius': '10px',
                'background-color': 'var(--col-cat)',
                'top': '5px',
                'left': 'calc(calc(var(--depth) * var(--folder-indent)) + 16px)',
            },
        }, base._Style());
    }

    _Render() {
        super._Render();
        ui.dom.El(`div`, { class: `cat-hint` }, this._host);
    }

    _OnDataUpdated(p_oldData) {
        super._OnDataUpdated(p_oldData);
        this.style.setProperty(`--col-cat`, `var(--col-${this._data.GetOption(`col`, `default`)})`);
    }

}

module.exports = CatItem;
ui.Register(`mkf-item-uni-cat`, CatItem);