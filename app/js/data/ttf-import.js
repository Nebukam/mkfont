const nkm = require(`@nkmjs/core`);
const css = nkm.style.CSS;
const Family = require(`./family-data-block`);
const Glyph = require(`./glyph-data-block`);
const IDS = require(`./ids`);
const ENUMS = require(`./enums`);
const UNICODE = require(`../unicode`);

const ttf2svg = require('ttf2svg');
const svgpath = require('svgpath');

const domparser = new DOMParser();

class TTFImport {
    constructor() { }

    //#region TTF processing

    static FamilyFromTTF(p_ttfBytes) {

        let
            svgFont = domparser.parseFromString(ttf2svg(p_ttfBytes), `image/svg+xml`),
            font = svgFont.getElementsByTagName(`font`)[0],
            fontFace = svgFont.getElementsByTagName(`font-face`)[0],
            glyphs = svgFont.getElementsByTagName(`glyph`);

        if (!fontFace) { throw new Error(`fontFace element missing`); }

        //console.log(ttf2svg(p_ttfBytes));

        let
            family = nkm.com.Rent(Family),
            em = this.numeric(fontFace, SVGOPS.ATT_EM_UNITS, 1000),
            width = this.numeric(font, SVGOPS.ATT_H_ADVANCE, em),
            height = em, //this.numeric(font, SVGOPS.ATT_V_ADVANCE, em),
            ascend = this.numeric(fontFace, SVGOPS.ATT_ASCENT, em * 0.7),
            descend = this.numeric(fontFace, SVGOPS.ATT_DESCENT, em * -0.25),
            baseline = ascend,
            max_adv_x = 0;

        family.Set(IDS.FAMILY, font.getAttribute(`id`));

        family.BatchSet({
            [IDS.EM_UNITS]: em,
            [IDS.WIDTH]: width,
            [IDS.HEIGHT]: height,
            [IDS.ASCENT]: ascend,
            [IDS.DESCENT]: descend,
            [IDS.BASELINE]: baseline,
        });

        // NOTE : When importing a TTF, the ASCENT is actually the baseline, and real ascender == BASELINE.

        family._UpdateDisplayValues();

        for (let i = 0; i < glyphs.length; i++) {

            let g = glyphs[i],
                gU = g.getAttribute(SVGOPS.ATT_UNICODE),
                gName = g.getAttribute(SVGOPS.ATT_GLYPH_NAME),
                path = g.getAttribute(SVGOPS.ATT_PATH),
                gW = this.numeric(g, SVGOPS.ATT_H_ADVANCE, width),
                gH = this.numeric(g, SVGOPS.ATT_V_ADVANCE, height);

            max_adv_x = Math.max(max_adv_x, gW);

            let newGlyph = nkm.com.Rent(Glyph),
                variant = newGlyph._defaultGlyph;

            //if (gW != width) { variant.Set(IDS.WIDTH, gW); }
            //if (glyphAdvY != fontAdvy) { defg.Set(IDS.HEIGHT, glyphAdvY); }

            // Flip & translate glyph
            path = svgpath(path)
                .scale(1, -1)
                .translate(0, baseline)
                .toString();

            if (gU.length != 1) {
                //assume ligature, handle it.
            } else {
                gU = UNICODE.GetAddress(gU);
            }

            newGlyph.BatchSet({
                [IDS.GLYPH_NAME]: gName,
                [IDS.UNICODE]: gU
            });

            // Reconstruct SVG Stats
            let bbox = SVGOPS.GetBBox(path);

            let
                svgStats = {
                    width: gW, //bbox.width,
                    height: baseline, //bsl - bbox.y,
                    BBox: bbox
                },
                sShift = bbox.x,
                sPush = gW - (bbox.width + sShift);

            svgStats.path = path;//svgpath(path).translate(-bbox.x, 0).toString();
            //SVGOPS.TranslateBBox(bbox, -bbox.x, 0);

            if (gH == height) { gH = null; }

            variant.BatchSet({
                [IDS.PATH_DATA]: svgStats,
                [IDS.HEIGHT]: gH,
            });

            family.AddGlyph(newGlyph);

            variant.transformSettings.BatchSet({
                [IDS.TR_SCALE_MODE]: ENUMS.SCALE_ASCENDER,
                [IDS.TR_WIDTH_SHIFT]: sShift,
                [IDS.TR_WIDTH_PUSH]: sPush,
            });

        }

        family.Set(IDS.WIDTH, Math.min(max_adv_x, em));

        return family;

    }

    static GetImportData(p_family, p_ttfBytes) {

        let
            svgFont = domparser.parseFromString(ttf2svg(p_ttfBytes), `image/svg+xml`),
            fontFace = svgFont.getElementsByTagName(`font-face`)[0],
            glyphs = svgFont.getElementsByTagName(`glyph`);

        if (!fontFace) { throw new Error(`fontFace element missing`); }

        let
            importList = [],
            em = this.numeric(fontFace, SVGOPS.ATT_EM_UNITS),
            width = this.numeric(fontFace, SVGOPS.ATT_H_ADVANCE, em),
            height = this.numeric(fontFace, SVGOPS.ATT_V_ADVANCE, em),
            ascent = this.numeric(fontFace, SVGOPS.ATT_ASCENT, em * 0.7),
            descent = this.numeric(fontFace, SVGOPS.ATT_DESCENT, em * -0.25),
            asc = p_family.Resolve(IDS.ASCENT),
            scale = asc / ascent;



        for (let i = 0; i < glyphs.length; i++) {

            let g = glyphs[i],
                gU = g.getAttribute(SVGOPS.ATT_UNICODE),
                gName = g.getAttribute(SVGOPS.ATT_GLYPH_NAME),
                path = g.getAttribute(SVGOPS.ATT_PATH),
                gW = this.numeric(g, SVGOPS.ATT_H_ADVANCE, width),
                gH = this.numeric(g, SVGOPS.ATT_V_ADVANCE, height);

            // Flip & translate path
            path = svgpath(path)
                .scale(scale, -scale)
                .translate(0, ascent * scale)
                .toString();

            if (gU.length != 1) {
                //assume ligature, handle it.
            } else {
                gU = UNICODE.GetAddress(gU);
            }

            // Reconstruct SVG Stats
            let
                bbox = SVGOPS.GetBBox(path),
                svgStats = {
                    width: bbox.width,
                    height: (ascent * scale),
                    BBox: bbox,
                    path: svgpath(path).translate(-bbox.x, 0).toString()
                },
                sShift = bbox.x,
                sPush = (gW * scale) - (bbox.width + sShift);

            SVGOPS.TranslateBBox(bbox, -bbox.x, 0);

            importList.push({
                [IDS.GLYPH_NAME]: gName,
                [IDS.UNICODE]: gU,
                [IDS.PATH_DATA]: svgStats,
                transforms: {
                    // Make sure to push defaults
                    [IDS.TR_BOUNDS_MODE]: ENUMS.BOUNDS_MIXED,
                    [IDS.TR_SCALE_MODE]: ENUMS.SCALE_ASCENDER,
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
