const nkm = require(`@nkmjs/core`);
const css = nkm.style.CSS;
const Family = require(`./family-data-block`);
const Glyph = require(`./glyph-data-block`);
const IDS = require(`./ids`);
const ENUMS = require(`./enums`);
const UNICODE = require(`../unicode`);

const { optimize } = require('svgo');
const ttf2svg = require('ttf2svg');
const svgpath = require('svgpath');
const { CatalogWatcher } = require('../../../../nkmjs/packages/nkmjs-documents/node_modules/@nkmjs/data-core/lib/catalogs');

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

        //console.log(svgFont);

        let
            family = new Family(),
            subFamily = family.defaultSubFamily,
            em_units = this.fwd(subFamily, IDS.EM_UNITS, fontFace, 1000),
            fontAdvx = subFamily.Set(IDS.WIDTH, em_units),
            fontAdvy = subFamily.Set(IDS.HEIGHT, em_units),
            ascent = this.fwd(subFamily, IDS.ASCENT, fontFace, em_units * 0.7),
            descent = this.fwd(subFamily, IDS.DESCENT, fontFace, em_units * -0.25);

        subFamily._UpdateDisplayValues();

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
                //assume ligature, handle it.
            } else {
                glyphUnicode = UNICODE.GetAddress(glyphUnicode);
            }

            newGlyph.BatchSet({
                [IDS.GLYPH_NAME]: glyphId,
                [IDS.UNICODE]: glyphUnicode
            });

            // Reconstruct SVG Stats
            let bbox = SVGOPS.GetBBox(glyphPath);

            let
                svgStats = {
                    width: bbox.width,
                    height: ascent - bbox.y,
                    BBox: bbox
                },
                sShift = bbox.x,
                sPush = glyphAdvX - (bbox.width + sShift);

            svgStats.path = svgpath(glyphPath).translate(-bbox.x, -bbox.y).toString();
            SVGOPS.TranslateBBox(bbox, -bbox.x, -bbox.y);

            defg.Set(IDS.PATH_DATA, svgStats);

            family.AddGlyph(newGlyph);

            defg.transformSettings.BatchSet({
                [IDS.TR_SCALE_MODE]: ENUMS.SCALE_NONE,
                [IDS.TR_WIDTH_SHIFT]: sShift,
                [IDS.TR_WIDTH_PUSH]: sPush,
            });

        }

        return family;

    }

    static GetImportData(p_subFamily, p_ttfBytes) {

        let
            svgFont = domparser.parseFromString(ttf2svg(p_ttfBytes), `image/svg+xml`),
            fontFace = svgFont.getElementsByTagName(`font-face`)[0],
            glyphs = svgFont.getElementsByTagName(`glyph`);

        if (!fontFace) { throw new Error(`fontFace element missing`); }

        let
            family = p_subFamily.family,
            subFamily = p_subFamily,
            importList = [],
            em_units = this.numeric(fontFace, IDS.EM_UNITS),
            fontAdvx = this.numeric(fontFace, IDS.WIDTH, em_units),
            fontAdvy = this.numeric(fontFace, IDS.HEIGHT, em_units),
            ascent = this.numeric(fontFace, IDS.ASCENT, em_units * 0.7),
            descent = this.numeric(fontFace, IDS.DESCENT, em_units * -0.25),
            asc = p_subFamily.Resolve(IDS.ASCENT),
            scale = subFamily.Resolve(IDS.EM_UNITS) / em_units, // Scale down on import to match existing settings;
            scale2 = scale * (asc / ascent);

        for (let i = 0; i < glyphs.length; i++) {

            let g = glyphs[i],
                glyphUnicode = g.getAttribute(IDS.UNICODE),
                glyphId = g.getAttribute(IDS.GLYPH_NAME),
                glyphPath = g.getAttribute(`d`),
                glyphAdvX = this.numeric(g, IDS.WIDTH, fontAdvx),
                glyphAdvY = this.numeric(g, IDS.HEIGHT, fontAdvy);

            // Flip & translate path
            glyphPath = svgpath(glyphPath)
                .scale(scale2, -scale2)
                .translate(0, ascent * scale)
                .toString();

            if (glyphUnicode.length != 1) {
                //assume ligature, handle it.
            } else {
                glyphUnicode = UNICODE.GetAddress(glyphUnicode);
            }

            // Reconstruct SVG Stats
            let
                bbox = SVGOPS.GetBBox(glyphPath),
                svgStats = {
                    width: bbox.width,
                    height: (ascent * scale) - bbox.y,
                    BBox: bbox,
                    path: svgpath(glyphPath).translate(-bbox.x, -bbox.y).toString()
                },
                sShift = bbox.x,
                sPush = (glyphAdvX * scale2) - (bbox.width + sShift);

            SVGOPS.TranslateBBox(bbox, -bbox.x, -bbox.y);

            importList.push({
                [IDS.GLYPH_NAME]: glyphId,
                [IDS.UNICODE]: glyphUnicode,
                [IDS.PATH_DATA]: svgStats,
                transforms: {
                    // Make sure to push defaults
                    [IDS.TR_BOUNDS_MODE]: ENUMS.BOUNDS_MIXED,
                    [IDS.TR_SCALE_MODE]: ENUMS.SCALE_NONE,
                    [IDS.TR_SCALE_FACTOR]: 1,
                    [IDS.TR_VER_ALIGN]: ENUMS.VALIGN_BASELINE,
                    [IDS.TR_VER_ALIGN_ANCHOR]: ENUMS.VANCHOR_BOTTOM,
                    [IDS.TR_HOR_ALIGN]: ENUMS.HALIGN_XMIN,
                    [IDS.TR_HOR_ALIGN_ANCHOR]: ENUMS.HANCHOR_LEFT,
                    [IDS.TR_WIDTH_SHIFT]: sShift,
                    [IDS.TR_WIDTH_PUSH]: sPush,
                }
            });

        }

        return importList.length > 0 ? importList : null;

    }

    static numeric(p_el, p_id, p_defaultValue = 0) {
        let value = Number(p_el.getAttribute(p_id));
        if (isNaN(value)) { value = p_defaultValue; }
        return value;
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
