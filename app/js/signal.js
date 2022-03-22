'use strict';

/**
 * @description TODO
 * @class
 * @hideconstructor
 * @memberof data.core
 */
class SIGNAL {
  constructor() { }

  /**
   * @description TODO
   * @type {symbol}
   * @customtag read-only
   */
  static UNICODE_CHANGED = Symbol(`addressChanged`);

  /**
   * @description TODO
   * @type {symbol}
   * @customtag read-only
   */
  static VIEWBOX_CHANGED = Symbol(`viewBoxChanged`);

  /**
   * @description TODO
   * @type {symbol}
   * @customtag read-only
   */
  static VARIANT_UPDATED = Symbol(`variantUpdated`);

  /**
   * @description TODO
   * @type {symbol}
   * @customtag read-only
   */
  static TTF_UPDATED = Symbol(`ttfUpdated`);

  /**
   * @description TODO
   * @type {symbol}
   * @customtag read-only
   */
  static SUBFAMILY_CHANGED = Symbol(`subfamily-changed`);

  /**
  * @description TODO
  * @type {symbol}
  * @customtag read-only
  */
  static GLYPH_ADDED = Symbol(`glyph-added`);

  /**
   * @description TODO
   * @type {symbol}
   * @customtag read-only
   */
  static GLYPH_REMOVED = Symbol(`glyph-removed`);

  /**
   * @description TODO
   * @type {symbol}
   * @customtag read-only
   */
  static SEARCH_STARTED = Symbol(`search-started`);

  /**
   * @description TODO
   * @type {symbol}
   * @customtag read-only
   */
  static SEARCH_COMPLETE = Symbol(`search-complete`);

}

module.exports = SIGNAL;