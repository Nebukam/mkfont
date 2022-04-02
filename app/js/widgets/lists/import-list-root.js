const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;
const lists = nkm.uilib.lists;

const mkfData = require(`../../data`);
const ImportListItem = require(`./import-list-item`);

class ImportListRoot extends lists.FolderListRoot {
    constructor() { super(); }
    
    static __draggable = false;

    static __defaultItemClass = ImportListItem;

    static __itemHeight = 66;

    _Init() {
        super._Init();
        //this._builder._defaultDirClass = Folder;
    }

    _PostInit() {
        super._PostInit();
        this.focusArea = null;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {

            },
            '.header':{ 'display':'none' }
        }, super._Style());
    }

    _Render() {
        super._Render();
    }

    _CleanUp() {
        this._cmd = null;
        super._CleanUp();
    }

}

module.exports = ImportListRoot;
ui.Register(`mkfont-import-list-root`, ImportListRoot);