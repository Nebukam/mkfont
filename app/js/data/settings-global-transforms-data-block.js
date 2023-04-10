'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.u;
const io = nkm.io;

const TransformSettingsDataBlock = require(`./settings-transforms-data-block`);
const IDS = require(`./ids`);

const base = TransformSettingsDataBlock;
class ImportSettingsDataBlock extends base {
    constructor() { super(); }

    static __VALUES = this.Ext(base.__VALUES, {
        [IDS.MONOSPACE]: { value: false }
    });

}

module.exports = ImportSettingsDataBlock;