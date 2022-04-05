'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.u;
const io = nkm.io;

const TransformSettingsDataBlock = require(`./settings-transforms-data-block`);
const IDS = require(`./ids`);

class ImportSettingsDataBlock extends TransformSettingsDataBlock {

    constructor() { super(); }

    _ResetValues(p_values) {

        super._ResetValues(p_values);

        p_values[IDS.IMPORT_PREFIX] = { value: `char` };
        p_values[IDS.IMPORT_SEPARATOR] = { value: `_` };
        p_values[IDS.IMPORT_MARK_X] = { value: `-x` };
        p_values[IDS.IMPORT_MARK_CAP] = { value: `-c` };
        p_values[IDS.IMPORT_MARK_COL] = { value: `#ff00ff` };

    }


}

module.exports = ImportSettingsDataBlock;