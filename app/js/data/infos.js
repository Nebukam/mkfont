'use strict';

const IDS = require(`./ids`);
const IDS_EXT = require(`./ids-ext`);
const IDS_PREFS = require(`./ids-prefs`);

class INFOS {
    constructor() { }

    static Get(p_id) {
        return IDS.GetInfos(p_id) || IDS_EXT.GetInfos(p_id) || IDS_PREFS.GetInfos(p_id) || null;
    }

    static LAYER_LIMIT = 20;

    static get MARK_COLOR() { return nkm.env.APP.PGet(IDS_EXT.IMPORT_MARK_COL, `FF00FF`); }

}

module.exports = INFOS;