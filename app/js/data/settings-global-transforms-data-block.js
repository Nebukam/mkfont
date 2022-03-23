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

        for (let p in this._values) {
            let obj = this._values[p];
            if (!(`override` in obj)) { obj.override = false; }
        }

        this._values[IDS.MONOSPACE] = { value: false };

    }


}

module.exports = ImportSettingsDataBlock;