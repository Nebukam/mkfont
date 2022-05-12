'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.u;
const io = nkm.io;

const SimpleDataEx = require(`./simple-data-ex`);
const IDS = require(`./ids`);
const TransformSettings = require(`./settings-transforms-data-block`);

const svgpath = require('svgpath');
const ContentManager = require(`../content-manager`);
const UNICODE = require('../unicode');
const SIGNAL = require('../signal');

const domparser = new DOMParser();
const svgString = `<glyph ${IDS.GLYPH_NAME}="" ${IDS.UNICODE}="" d="" ${IDS.WIDTH}="" ${IDS.HEIGHT}="" ></glyph>`;

const svgGlyphRef = domparser.parseFromString(svgString, `image/svg+xml`).getElementsByTagName(`glyph`)[0];

const GlyphVariantDataBlock = require(`./glyph-variant-data-block`);

class GlyphVariantRef extends GlyphVariantDataBlock {

    constructor() { super(); }


    _ResetValues(p_values) {
        super._ResetValues(p_values);
        p_values[IDS.SHOW_ALL_LAYERS] = { value: false };
    }


}

module.exports = GlyphVariantRef;