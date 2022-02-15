'use strict';

/**
 * @description TODO
 * @class
 * @hideconstructor
 * @memberof data.core
 */
class SIGNAL{
    constructor() {}

    /**
     * @description TODO
     * @type {symbol}
     * @customtag read-only
     */
    static ADDRESS_CHANGED = Symbol(`addressChanged`);

    /**
     * @description TODO
     * @type {symbol}
     * @customtag read-only
     */
     static VIEWBOX_CHANGED = Symbol(`viewBoxChanged`);


}

module.exports = SIGNAL;