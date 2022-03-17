const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;
const lists = nkm.uilib.lists;

const mkfData = require(`../../data`);
const BlockItem = require(`./block-item`);

class BlockRoot extends lists.FolderListRoot {
    constructor() { super(); }

    static __draggable = false;
    static __defaultItemClass = BlockItem;

    _Init() {
        super._Init();
        //this._builder._defaultDirClass = Folder;
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

module.exports = BlockRoot;
ui.Register(`mkfont-block-root`, BlockRoot);