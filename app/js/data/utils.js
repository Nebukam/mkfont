'use strict';

/**
 * @description TODO
 * @class
 * @hideconstructor
 * @memberof data.core
 */
class UTILS {
    constructor() { }

    static Resolve(p_id, p_self, ...p_fallbacks){
        
        //console.log(`Resolve ${p_id} in ${p_self} -> ${p_fallbacks}`);
        let result = p_self.Get(p_id);

        // TODO : If valueObj.override = true, attempt to return local value
        // TODO : If valueObj.override = false, skip local value and go straight to inherited one

        if(result != null){ return result; }

        // Check if value has designed fallback first
        if(p_id in p_self._values){
            let obj = p_self._values[p_id];
            if(`defaultsTo` in obj){
                result = p_self.Get(obj.defaultsTo);
            }
        }

        if(result != null){ return result; }

        if(p_fallbacks.length > 0){
            p_self = p_fallbacks.shift();
            return this.Resolve(p_id, p_self, ...p_fallbacks);
        }

        return null;

    }

}

module.exports = UTILS;