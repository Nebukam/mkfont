'use strict';

const doc = nkm.documents;

class FamilyDocument extends doc.DocumentEx {
    constructor() { super(); }

    static __NFO__ = nkm.com.NFOS.Ext({
        [doc.IDS.TYPE_RSC]: nkm.io.resources.JSONResource,
        [doc.IDS.SERIAL_CTX]: nkm.data.serialization.CONTEXT.JSON,
        [doc.IDS.DATA_BOUND]: true,
    }, doc.DocumentEx);

}

module.exports = FamilyDocument;