const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;
const lists = nkm.uilib.lists;

const mkfData = require(`../../data`);

class FamilyItem extends lists.FolderListItem {
    constructor() { super(); }

    static __draggable = false;

    _Init() {
        super._Init();
        this._extensions.Remove(this._extDrag);
    }

    _PostInit() {
        super._PostInit();
        //this.focusArea = this;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {

            },
        }, super._Style());
    }

    _Render() {
        super._Render();
    }

    Activate(p_evt) {
        if (!super.Activate(p_evt)) { return false; }
        
        let editor = nkm.datacontrols.FindEditor(this);
        //console.log(`Activated : `,editor);
        if(editor){ editor.SetActiveRange(this._data); }

        return true;
    }

    _CleanUp() {
        this._cmd = null;
        super._CleanUp();
    }

}

module.exports = FamilyItem;
ui.Register(`mkfont-item-uni-family`, FamilyItem);