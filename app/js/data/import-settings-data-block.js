'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.utils;
const io = nkm.io;

const SimpleDataEx = require(`./simple-data-ex`);
const IDS = require(`./ids`);

const svgpath = require('svgpath');
const UNICODE = require('../unicode');

class ImportSettingsDataBlock extends SimpleDataEx {

    constructor() { super(); }

    _Init() {

        super._Init();

        this._values = {
            [IDS.IMPORT_APPLY_SCALE]: { value: true },
            [IDS.IMPORT_SCALE_FACTOR_AUTO]: { value: true },
            [IDS.IMPORT_SCALE_FACTOR_AUTO_REF]: { value: null },
            [IDS.IMPORT_SCALE_FACTOR]: { value: 10 },
            [IDS.IMPORT_MATCH_WIDTH]: { value: true },
            [IDS.IMPORT_MATCH_WIDTH_OFFSET]: { value: 0 },
            [IDS.IMPORT_MOVE_TO_BASELINE]: { value: true },
        }

    }

    _CleanUp() {
        super._CleanUp();
    }


}

module.exports = ImportSettingsDataBlock;