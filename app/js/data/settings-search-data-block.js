'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.utils;
const io = nkm.io;

const SIGNAL = require(`../signal`);
const SimpleDataEx = require(`./simple-data-ex`);
const IDS_EXT = require(`./ids-ext`);
const ENUMS = require(`./enums`);

class SettingsSearchDataBlock extends SimpleDataEx {

    constructor() { super(); }

    _Init() {

        super._Init();

        this._values = {
            [IDS_EXT.SEARCH_RESULTS]: { value: null },
            [IDS_EXT.SEARCH_ENABLED]: { value: false },
            [IDS_EXT.SEARCH_TERM]: { value: `` },
            [IDS_EXT.SHOW_DECOMPOSITION]: { value: true },
        }

        this._searchCount = 0;
        this._searchCovered = 0;
        this._searchMethod = null;
        this._displayRange = null;
        this._results = [];

        this._delayedAdvance = nkm.com.DelayedCall(this._Bind(this._AdvanceSearch));

    }

    _UpdateSearchResults(p_displayRange){
        this._searchCount = 0;
        this._searchCovered = 0;
        this._displayRange = p_displayRange;

        

        this._Broadcast(SIGNAL.SEARCH_STARTED, this);
    }

    _AdvanceSearch(){
        this._searchCovered += this._searchMethod();
        if(this._searchCovered >= this._searchCount){
            this._values[IDS_EXT.SEARCH_RESULTS].value = null;
            this.Set(IDS_EXT.SEARCH_RESULTS, this._results);
            this._Broadcast(SIGNAL.SEARCH_COMPLETE, this);
        }else{
            this._delayedAdvance.Schedule();
        }
    }

    _SearchInBlock(){

    }



}

module.exports = SettingsSearchDataBlock;