'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.utils;
const io = nkm.io;


class FontVariantDataBlock extends nkm.data.DataBlock {

    constructor() { super(); }

    static NULL = new FontVariantDataBlock();

    _Init() {

        super._Init();

        this._font = null;

        this._params = {
            'id': {
                value: `font_id`
            },
            'variant-name': {
                value: `Bold`
            },
            'family': {
                value: null
            },
            'font-weight': {
                value: `bold`
            },
            'font-style': {
                value: `normal`
            },
            'units-per-em': {
                value: 1000,
                desc: `specifies the number of coordinate units on the "em square", an abstract square whose height is the intended distance between lines of type in the same type size. This is the size of the design grid on which glyphs are laid out.`
            },
            'cap-height': {
                value: 1000,
                desc: `defines the height of uppercase glyphs of the font within the font coordinate system.`
            },
            'x-height': {
                value: 500,
                desc: `indicates the height of lowercase glyphs in the font within the font coordinate.`
            },
            'ascent': {
                value: 700,
                desc: `defines the maximum unaccented height of the font within the font coordinate system.`
            },
            'descent': {
                value: 300,
                desc: `defines the maximum unaccented depth of the font.`
            },
            'horiz-origin-x': {
                value: null,
                desc: `indicates the x-coordinate in the font coordinate system of the origin of a glyph to be used when drawing horizontally oriented text.`
            },
            'horiz-origin-y': {
                value: null,
                desc: `indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing horizontally oriented text.`
            },
            'horiz-adv-x': {
                value: 1000,
                desc: `indicates the horizontal advance after rendering a glyph in horizontal orientation.`
            },
            'vert-origin-x': {
                value: null,
                desc: `indicates the x-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.`
            },
            'vert-origin-x': {
                value: null,
                desc: `indicates the y-coordinate in the font coordinate system of the origin of a glyph to be used when drawing vertically oriented text.`
            },
            'vert-adv-y': {
                value: null,
                desc: `indicates the vertical advance after rendering a glyph in vertical orientation.`
            },
            'alphabetic': {
                value: 0,
            },
            'mathematical': {
                value: 350,
            },
            'ideographic': {
                value: 400,
            },
            'hanging': {
                value: 500,
            }
        }

        this._svgString = ``;
        this._svgURI = null;

        this._xml = document.implementation.createDocument(null, `font`);
        this._xml = this._xml.getElementsByTagName(`font`)[0];

        this._xmlFontFace = document.createElement(`font-face`);
        this._xml.appendChild(this._xmlFontFace);

        this._xmlFontFaceSrc = document.createElement(`font-face-src`);
        this._xmlFontFace.appendChild(this._xmlFontFaceSrc);

        this._xmlFontFaceSrcName = document.createElement(`font-face-src-name`);
        this._xmlFontFaceSrc.appendChild(this._xmlFontFaceSrcName);

        this._xmlMissingGlyph = document.createElement(`missing-glyph`);
        this._xml.appendChild(this._xmlMissingGlyph);

        this._UpdateFontObject();

    }

    get font() { return this._font; }
    set font(p_value) { this._font = p_value; }

    get xml() { return this._xml; }
    get params() { return this._params; }

    _paramValue(p_id) {
        let result = this._params[p_id];
        if (!result) { result = this._font.defaultVariant.params[p_id]; }
        return result ? result.value : null;
    }

    _UpdateFontObject() {

        dom.SAtt(this._xml, `id`, this._paramValue(`id`), true);
        dom.SAtt(this._xml, `horiz-adv-x`, this._paramValue(`horiz-adv-x`), true);
        dom.SAtt(this._xmlFontFaceSrcName, `name`, `${this._paramValue(`family`)} ${this._paramValue(`variant-name`)}`, true);

        dom.SAtt(this._xmlFontFace, this._params, `value`, true);

    }

    _CleanUp() {
        this.parentGlyph = null;
        super._CleanUp();
    }


}

module.exports = FontVariantDataBlock;