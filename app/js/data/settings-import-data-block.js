'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.u;
const io = nkm.io;

const TransformSettingsDataBlock = require(`./settings-transforms-data-block`);
const IDS_EXT = require(`./ids-ext`);
const ENUMS = require(`./enums`);
const UNICODE = require("../unicode");

class ImportSettingsDataBlock extends TransformSettingsDataBlock {

    constructor() { super(); }

    _ResetValues(p_values) {

        super._ResetValues(p_values);

        p_values[IDS_EXT.IMPORT_ASSIGN_MODE] = { value: ENUMS.ASSIGN_FILENAME };
        p_values[IDS_EXT.IMPORT_OVERLAP_MODE] = { value: ENUMS.OVERLAP_PRESERVE };
        
        //Filename 
        p_values[IDS_EXT.IMPORT_PREFIX] = { value: `char` };
        p_values[IDS_EXT.IMPORT_SEPARATOR] = { value: `_` };
        p_values[IDS_EXT.IMPORT_MARK_X] = { value: `-x` };
        p_values[IDS_EXT.IMPORT_MARK_CAP] = { value: `-c` };
        p_values[IDS_EXT.IMPORT_MARK_COL] = { value: `#ff00ff` };

        //Block
        p_values[IDS_EXT.IMPORT_BLOCK] = { value: UNICODE.instance._blockCatalog.At(0) };
        p_values[IDS_EXT.IMPORT_BLOCK_START] = { value: ENUMS.BLOCK_START_BEGIN };

    }


}

module.exports = ImportSettingsDataBlock;