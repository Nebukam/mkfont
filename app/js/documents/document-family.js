'use strict';

class FamilyDocument extends nkm.documents.DocumentEx{
    constructor(){super();}

    static __NFO__ = nkm.com.NFOS.Ext({
        resource: nkm.io.resources.JSONResource,
        serializationContext: data.serialization.CONTEXT.JSON
        }, nkm.documents.DocumentEx.__NFO__);

    _CheckOptions( p_options = null ){
        p_options = p_options ? p_options : {};
        p_options.io = env.ENV.IF_NODE(nkm.io.IO_TYPE.FILE_SYSTEM, nkm.io.IO_TYPE.LOCAL_STORAGE);
        return p_options;
    }
    
}

module.exports = FamilyDocument;