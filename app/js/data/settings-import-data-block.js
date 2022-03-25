'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.utils;
const io = nkm.io;

const TransformSettingsDataBlock = require(`./settings-transforms-data-block`);
const IDS = require(`./ids`);

class ImportSettingsDataBlock extends TransformSettingsDataBlock {

    constructor() { super(); }

    _Init() {

        super._Init();

        this._values[IDS.IMPORT_PREFIX] = { value: `char` };
        this._values[IDS.IMPORT_SEPARATOR] = { value: `_` };
        this._values[IDS.IMPORT_MARK_X] = { value: `-x` };
        this._values[IDS.IMPORT_MARK_CAP] = { value: `-c` };
        this._values[IDS.IMPORT_MARK_COL] = { value: `#ff00ff` };

    }


}

module.exports = ImportSettingsDataBlock;