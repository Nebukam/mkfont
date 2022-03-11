const nkm = require(`@nkmjs/core`);
const css = nkm.style.CSS;
const Family = require(`./family-data-block`);
const Glyph = require(`./glyph-data-block`);
const IDS = require(`./ids`);
const UNICODE = require(`../unicode`);

const { optimize } = require('svgo');
const ttf2svg = require('ttf2svg');
const svgpath = require('svgpath');

const domparser = new DOMParser();

class TTFImport {
    constructor() { }

    //#region TTF processing

    static FamilyFromTTF(p_ttfBytes) {

        let
            svgFont = domparser.parseFromString(ttf2svg(p_ttfBytes), `image/svg+xml`),
            fontFace = svgFont.getElementsByTagName(`font-face`)[0],
            glyphs = svgFont.getElementsByTagName(`glyph`);

        console.log(ttf2svg(p_ttfBytes));

        //console.log(svgFont);

        let
            family = new Family(),
            subFamily = family.defaultSubFamily,
            em_units = 1000,
            fontAdvx = em_units,
            fontAdvy = em_units,
            ascent = em_units * 0.7,
            descent = em_units * -0.25;

        if (fontFace) {
            this._sXMLAttNum(fontFace, IDS.EM_UNITS, subFamily, 1000);
            ascent = this._sXMLAttNum(fontFace, IDS.ASCENT, subFamily, ascent);
            descent = this._sXMLAttNum(fontFace, IDS.DESCENT, subFamily, descent);
            em_units = this._sXMLAttNum(fontFace, IDS.EM_UNITS, subFamily, em_units);
        }

        fontAdvx = subFamily.Set(IDS.WIDTH, em_units);
        fontAdvy = subFamily.Set(IDS.HEIGHT, em_units);

        let
            size = Math.max(em_units, ascent - descent),
            displaySize = size * 1.25,
            displayOffset = (displaySize - size) * -0.5;

        subFamily.Set(IDS.SIZE, size);
        subFamily.Set(IDS.DISPLAY_SIZE, displaySize);
        subFamily.Set(IDS.DISPLAY_OFFSET, displayOffset);

        for (let i = 0; i < glyphs.length; i++) {

            let g = glyphs[i],
                glyphUnicode = g.getAttribute(`unicode`),
                glyphId = g.getAttribute(`glyph-name`),
                glyphPath = g.getAttribute(`d`),
                glyphAdvX = Number(g.getAttribute(IDS.WIDTH) || fontAdvx),
                glyphAdvY = Number(g.getAttribute(IDS.HEIGHT) || fontAdvy);

            let newGlyph = new Glyph(),
                defg = newGlyph._defaultGlyph;

            if (glyphAdvX != fontAdvx) { defg.Set(IDS.WIDTH, glyphAdvX); }
            //if (glyphAdvY != fontAdvy) { defg.Set(IDS.HEIGHT, glyphAdvY); }

            // Flip & translate glyph
            glyphPath = svgpath(glyphPath)
                .scale(1, -1)
                .translate(0, ascent)
                .toString();

            if (glyphUnicode.length != 1) {
                //assume ligature
            } else {
                glyphUnicode = UNICODE.GetAddress(glyphUnicode);
            }


            newGlyph.BatchSet({
                [IDS.GLYPH_NAME]: glyphId,
                [IDS.UNICODE]: glyphUnicode
            });

            defg.Set(IDS.PATH, glyphPath);

            family.AddGlyph(newGlyph);

        }

        return family;

    }

    static _sXMLAttNum(p_el, p_prop, p_data, p_default = null) {
        let value = p_el.getAttribute(p_prop);
        if (!value) {
            if (!p_default) { return null; }
            value = p_default;
        }
        value = Number(value);
        p_data.Set(p_prop, value);
        return value;
    }

    static _sXMLAttString(p_el, p_prop, p_data, p_default = null) {
        let value = p_el.getAttribute(p_prop);
        if (!value) {
            if (!p_default) { return null; }
            value = p_default;
        }
        p_data.Set(p_prop, value);
        return value;
    }

    //#endregion

}

module.exports = TTFImport;
