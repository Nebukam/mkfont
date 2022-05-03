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
  static SEARCH_TOGGLED = Symbol(`search-toggled`);

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

  /**
   * @description TODO
   * @type {symbol}
   * @customtag read-only
   */
  static SEARCH_PROGRESS = Symbol(`search-progress`);

  /**
   * @description TODO
   * @type {symbol}
   * @customtag read-only
   */
  static LAYER_ADDED = Symbol(`layer-added`);

  /**
   * @description TODO
   * @type {symbol}
   * @customtag read-only
   */
  static LAYER_REMOVED = Symbol(`layer-removed`);

  /**
  * @description TODO
  * @type {symbol}
  * @customtag read-only
  */
  static LAYERS_UPDATED = Symbol(`layers-updated`);

  /**
  * @description TODO
  * @type {symbol}
  * @customtag read-only
  */
   static LAYER_VALUE_CHANGED = Symbol(`layer-value-changed`);

}

module.exports = SIGNAL;