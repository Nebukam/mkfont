'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.u;
const io = nkm.io;

const SimpleDataEx = require(`./simple-data-ex`);
const IDS_EXT = require(`./ids-ext`);

class LigaImportSettingsDataBlock extends SimpleDataEx {

    constructor() { super(); }

    _ResetValues(p_values) {

        p_values[IDS_EXT.LIGA_TEXT] = { value: `` };
        p_values[IDS_EXT.LIGA_MIN] = { value: 2 };
        p_values[IDS_EXT.LIGA_MAX] = { value: 3 };
        p_values[IDS_EXT.LIGA_MIN_OCCURENCE] = { value: 2 };

    }

}

module.exports = LigaImportSettingsDataBlock;