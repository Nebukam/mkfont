'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const mkfData = require(`../../data`);

class CmdCreateFamilyDoc extends nkm.documents.commands.DocumentCreate {
    constructor() { super(); }

    static __displayName = `New .mkfont`;
    static __displayIcon = `new`;

    static __docType = nkm.documents.bound.JSONDocument;
    static __dataType = mkfData.Family;
    static __fileInfos = { name: 'MKFont files', extensions: ['mkfont'] };

}

module.exports = CmdCreateFamilyDoc;