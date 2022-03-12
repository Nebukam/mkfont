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

        if (!fontFace) { throw new Error(`fontFace element missing`); }

        let
            family = new Family(),
            subFamily = family.defaultSubFamily,
            em_units = this.fwd(subFamily, IDS.EM_UNITS, fontFace, 1000),
            fontAdvx = subFamily.Set(IDS.WIDTH, em_units),
            fontAdvy = subFamily.Set(IDS.HEIGHT, em_units),
            ascent = this.fwd(subFamily, IDS.ASCENT, fontFace, em_units * 0.7),
            descent = this.fwd(subFamily, IDS.DESCENT, fontFace, em_units * -0.25),
            size = subFamily.Set(IDS.SIZE, Math.max(em_units, ascent - descent)),
            displaySize = size * 1.25;

            subFamily.Set(IDS.DISPLAY_SIZE, displaySize),
            subFamily.Set(IDS.DISPLAY_OFFSET, (displaySize - size) * -0.5);

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

            // Reconstruct SVG Stats
            // get bounding box and clamp it

            newGlyph.BatchSet({
                [IDS.GLYPH_NAME]: glyphId,
                [IDS.UNICODE]: glyphUnicode
            });

            defg.Set(IDS.PATH, glyphPath);

            family.AddGlyph(newGlyph);

        }

        return family;

    }

    static fwd(p_data, p_id, p_el, p_defaultValue = null) {
        let value = p_el.getAttribute(p_id);
        if (!value) {
            if (!p_defaultValue) { return null; }
            value = p_defaultValue;
        }
        value = Number(value);
        p_data.Set(p_id, value);
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
