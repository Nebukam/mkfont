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
        p_values[IDS.MONOSPACE] = { value: false };
    }


}

module.exports = ImportSettingsDataBlock;