'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.utils;
const io = nkm.io;

const TransformSettingsDataBlock = require(`./tr-settings-data-block`);
const IDS = require(`./ids`);

class ImportSettingsDataBlock extends TransformSettingsDataBlock {

    constructor() { super(); }

    _Init() {

        super._Init();

        this._values[IDS.IMPORT_PREFIX] = { value: `char` };
        this._values[IDS.IMPORT_SEPARATOR] = { value: `_` };

    }


}

module.exports = ImportSettingsDataBlock;