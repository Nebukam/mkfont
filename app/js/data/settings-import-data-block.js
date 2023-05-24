'use strict';

const TransformSettingsDataBlock = require(`./settings-transforms-data-block`);
const IDS_EXT = require(`./ids-ext`);
const ENUMS = require(`./enums`);
const UNICODE = require("../unicode");

const base = TransformSettingsDataBlock;
class ImportSettingsDataBlock extends TransformSettingsDataBlock {
    constructor() { super(); }

    static __VALUES = {

        ...base.__VALUES,

        [IDS_EXT.IMPORT_ASSIGN_MODE]: { value: ENUMS.ASSIGN_FILENAME },
        [IDS_EXT.IMPORT_OVERLAP_MODE]: { value: ENUMS.OVERLAP_PRESERVE },

        //Filename 
        [IDS_EXT.IMPORT_PREFIX]: { value: `char` },
        [IDS_EXT.IMPORT_SEPARATOR]: { value: `_` },
        [IDS_EXT.IMPORT_MARK_X]: { value: `-x` },
        [IDS_EXT.IMPORT_MARK_CAP]: { value: `-c` },
        [IDS_EXT.IMPORT_MARK_COL]: { value: `#ff00ff` },

        //Block
        [IDS_EXT.IMPORT_BLOCK]: { value: UNICODE._blockCatalog.At(0) },
        [IDS_EXT.IMPORT_BLOCK_START]: { value: ENUMS.BLOCK_START_BEGIN },

        [IDS_EXT.IMPORT_BIND_RESOURCE]: { value: true },
        [IDS_EXT.IMPORT_TEXT_AS_LAYERS]: { value: true },

    };

}

module.exports = nkm.data.Register(ImportSettingsDataBlock);