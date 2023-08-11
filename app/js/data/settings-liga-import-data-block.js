'use strict';

const FontObjectData = require(`./font-object-data`);
const IDS_EXT = require(`./ids-ext`);

class LigaImportSettingsDataBlock extends FontObjectData {
    constructor() { super(); }

    static __VALUES = {
        [IDS_EXT.LIGA_TEXT]: { value: `` },
        [IDS_EXT.LIGA_MIN]: { value: 2 },
        [IDS_EXT.LIGA_MAX]: { value: 3 },
        [IDS_EXT.LIGA_MIN_OCCURENCE]: { value: 2 },
        [IDS_EXT.LIGA_EACH_LINE]: { value: false },
    };

}

module.exports = nkm.data.Register(LigaImportSettingsDataBlock);