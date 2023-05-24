'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;
const lists = nkm.uilib.lists;

const mkfData = require(`../../data`);

const base = lists.FolderList;
class CatGroupItem extends base {
    constructor() { super(); }

    static __draggable = false;

    _Init() {
        super._Init();
        this._dots = [];
        this._extensions.Remove(this._extDrag);
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {

            },
            '.hint-ctnr': {
                ...nkm.style.rules.pos.rel,
                ...nkm.style.rules.flex.column.wrap,
                ...nkm.style.rules.item.fill,
                'max-height': `8px`,
                'grid-gap': `2px`,
                'align-content': `flex-start`,
                'margin-left': `4px`,
                'opacity': `0.5`
            },
            '.cat-hint': {
                'width': '2px',
                'height': '2px',
                'border-radius': '10px',
                'background-color': 'var(--col-cat)',
            },
        }, base._Style());
    }

    _Render() {
        super._Render();
        this._dotCtnr = ui.dom.El(`div`, { class: `hint-ctnr` }, this._header);
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        while (this._dots.length != 0) { ui.dom.Detach(this._dots.pop()); }
        if (this._data) {
            for (let i = 0; i < this._data._items.length; i++) {
                let item = this._data._items[i],
                    dot = ui.El(`div`, { class: `cat-hint` }, this._dotCtnr);

                dot.style.setProperty(`--col-cat`, `var(--col-${item.GetOption(`col`, `default`)})`);
                this._dots.push(dot);
            }
        }
    }

}

module.exports = CatGroupItem;
ui.Register(`mkf-item-uni-cat-group`, CatGroupItem);