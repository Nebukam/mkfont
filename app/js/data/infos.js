'use strict';

const IDS = require(`./ids`);
const IDS_EXT = require(`./ids-ext`);
const IDS_PREFS = require(`./ids-prefs`);

class INFOS {
    constructor() { }

    static LAYER_LIMIT = 50;

    static get MARK_COLOR() {
        let col = nkm.settings.Get(IDS_PREFS.MARK_COLOR, `FF00FF`);
        if (col.substr(0, 1) == `#`) { col = col.substr(1); }
        return col.toLowerCase();
    }

}

module.exports = INFOS;