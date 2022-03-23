'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.utils;
const io = nkm.io;

const GlyphVariant = require(`./glyph-variant-data-block`);
const IDS = require(`./ids`);

const domparser = new DOMParser();
const svgString = `<missing-glyph ${IDS.GLYPH_NAME}="" ${IDS.UNICODE}="" d="" ${IDS.WIDTH}="" ${IDS.HEIGHT}=""></missing-glyph>`;

const missingGlyphRef = domparser.parseFromString(svgString, `image/svg+xml`).getElementsByTagName(`missing-glyph`)[0];

class GlyphMissingDataBlock extends GlyphVariant {

    constructor() { super(); }

    _BuildFontObject() { console.log(`huh`); return missingGlyphRef.cloneNode(true); }


}

module.exports = GlyphMissingDataBlock;