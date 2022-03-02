const nkm = require(`@nkmjs/core`);

class GlyphSlot extends nkm.data.catalogs.CatalogItem {
    constructor() { super(); }

    _OnDataChanged(p_newData, p_oldData) {
        
        super._OnDataChanged(p_newData, p_oldData);

        if(p_oldData){ p_oldData.Unwatch(nkm.com.SIGNAL.UPDATED, this._CommitUpdate, this); }
        if(p_newData){ p_newData.Watch(nkm.com.SIGNAL.UPDATED, this._CommitUpdate, this); }
        
    }

    _CommitUpdate(){
        this._delayedUpdate.Schedule();
    }

}

module.exports = GlyphSlot;