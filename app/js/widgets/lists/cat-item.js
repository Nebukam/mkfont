/*const nkm = require(`@nkmjs/core`);*/
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;
const lists = nkm.uilib.lists;

const mkfData = require(`../../data`);

class CatItem extends lists.FolderListItem {
    constructor() { super(); }


    _Init() {
        super._Init();
    }

    _PostInit() {
        super._PostInit();
        //this.focusArea = this;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {

            },
            '.cat-hint': {
                'position':'absolute',
                'width':'4px',
                'height':'4px',
                'border-radius':'10px',
                'background-color': 'var(--col-cat)',
                'top': '5px',
                'left': 'calc(calc(var(--depth) * var(--folder-indent)) + 16px)',
                //'opacity':'0.5'
            },
        }, super._Style());
    }

    _Render() {
        super._Render();
        ui.dom.El(`div`, {class:`cat-hint`}, this._host);
    }

    _OnDataUpdated(p_oldData){
        super._OnDataUpdated(p_oldData);
        this.style.setProperty(`--col-cat`, `var(--col-${this._data.GetOption(`col`, `default`)})`);
    }

    Activate(p_evt) {
        if (!super.Activate(p_evt)) { return false; }
        
        let editor = nkm.datacontrols.FindEditor(this);
        //console.log(`Activated : `,editor);
        if(editor){ editor.SetActiveRange(this._data); }

        return true;
    }

    _Cleanup() {
        this._cmd = null;
        super._Cleanup();
    }

}

module.exports = CatItem;
ui.Register(`mkfont-filter-item`, CatItem);