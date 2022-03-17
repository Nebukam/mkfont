const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;
const lists = nkm.uilib.lists;

const mkfData = require(`../../data`);

const CatItem = require(`./cat-item`);
const CatList = require(`./cat-list`);

class CatRoot extends lists.FolderListRoot {
    constructor() { super(); }

    static __draggable = false;
    static __defaultItemClass = CatItem;
    static __defaultDirClass = CatList;

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

module.exports = CatRoot;
ui.Register(`mkfont-filter-root`, CatRoot);