const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;
const lists = nkm.uilib.lists;

const mkfData = require(`../../data`);

const FilterItem = require(`./filter-item`);
const FilterList = require(`./filter-list`);

class FilterRoot extends lists.FolderListRoot {
    constructor() { super(); }

    static __defaultItemClass = FilterItem;
    static __defaultDirClass = FilterList;

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

module.exports = FilterRoot;
ui.Register(`mkfont-filter-root`, FilterRoot);