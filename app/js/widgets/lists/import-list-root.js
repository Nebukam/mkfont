const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;
const lists = nkm.uilib.lists;

const mkfData = require(`../../data`);
const ImportListItem = require(`./import-list-item`);

class ImportListRoot extends lists.FolderListRoot {
    constructor() { super(); }

    static __defaultItemClass = ImportListItem;

    static __itemHeight = 50;

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

    _Cleanup() {
        this._cmd = null;
        super._Cleanup();
    }

}

module.exports = ImportListRoot;
ui.Register(`mkfont-import-list-root`, ImportListRoot);