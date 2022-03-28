//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const mkfData = require(`../../data`);

class CmdIOFamily extends actions.Command {
    constructor() { super(); }

    static __dataMap = new Map();
    static __rscMap = new Map();

    _SetAssoc(p_rsc, p_family){
        this.__dataMap.set(p_rsc, p_family);
        this.__rscMap.set(p_rsc);
    }

    _GetRsc(p_family){

    }

    _GetFamily(p_rsc){

    }

}

module.exports = CmdIOFamily;