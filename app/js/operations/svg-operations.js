const nkm = require(`@nkmjs/core`);
const mkfData = require(`../data`);
const IDS = mkfData.IDS;

const { optimize } = require('svgo');
const ttf2svg = require('ttf2svg');
const svg2ttf = require('svg2ttf');
const svgpath = require('svgpath');

const domparser = new DOMParser();

const glyphStyle = `fill:var(--glyph-color); stroke:none;`;
const svgFontString =
    `<font>` +
    `   <font-face>` +
    `       <font-face-src><font-face-src-name></font-face-src-name></font-face-src>` +
    `   </font-face>` +
    `   <missing-glyph></missing-glyph>` +
    `</font>`;

class SVGOperations {
    constructor() { }

    //#region raw svg string processing

    static ProcessString(p_value, p_params) {

        let
            col = `eaeaea`,
            viewBox = { width: 1000, height: 1000 };

        // Quickfixes on string

        try {
            // Replace all colors with white
            let s = p_value.split(`:#`);
            for (let i = 1; i < s.length; i++) {
                let s2 = s[i], s3 = s2[3], s6 = s2[6];
                if (s3 == `;` || s3 == `}` || s3 == `"`) { s2 = `${col}${s2.substr(3)}`; }
                else if (s6 == `;` || s6 == `}` || s6 == `"`) { s2 = `${col}${s2.substr(6)}`; }
                s[i] = s2;
            }
            p_value = s.join(`:#`);
        } catch (e) { }

        // Manipulation on SVG element

        let svg = domparser.parseFromString(p_value, `image/svg+xml`)
            .getElementsByTagName(`svg`)[0];

        if (!svg) { return null; }

        this._rAtts(svg, [`width`, `height`, `viewBox`]);

        // Add viewBox
        svg.setAttribute(`viewBox`, `0 0 ${viewBox.width} ${viewBox.height}`);

        // Flatten groups
        let groups = svg.getElementsByTagName(`g`);
        for (let i = 0; i < groups.length; i++) {
            let children = groups[i].children;
            for (let c = 0; c < children.length; c++) {
                let child = children[c];
                if (child.tagName == `g`) { child.remove(); }
                else { svg.appendChild(child); }
            }
            //groups[i].remove();
        }

        // Remove unsupported rounded corners on rect elements
        this._rAttsOnTag(svg, `rect`, [`rx`, `ry`]);

        svg = domparser.parseFromString(
            optimize(svg.outerHTML,
                {
                    multipass: true,
                    plugins:
                        [
                            `preset-default`,
                            {
                                name: `convertShapeToPath`,
                                params: { convertArcs: true }
                            }
                        ]

                }).data, `image/svg+xml`)
            .getElementsByTagName(`svg`)[0];

        svg.removeAttribute(`style`);
        let path = svg.getElementsByTagName(`path`)[0];

        if (!path) {
            console.log(svg);
            console.warn(`SVG will be ignored : it does not contain a path.`);
            return null;
        } else {

            let pathlist = svg.getElementsByTagName(`path`);
            let str = ``;
            path = pathlist[0];
            for (let i = 0; i < pathlist.length; i++) {
                let tp = pathlist[i];
                str += tp.getAttribute(`d`) + ` `;
                if (i > 0) { tp.remove(); }
            }

            path.setAttribute(`d`, str);

            // DEBUG : Try to scale D attribute
            path.removeAttribute(`style`);
            path.setAttribute(`fill`, `#${col}`);
            path.setAttribute(`style`, glyphStyle);
            /*
            if (path.hasAttribute(`d`)) {
                let d = path.getAttribute(`d`);
                d = svgpath(d)
                    .scale(10)
                    //.translate(100,200)
                    //.rel()
                    //.round(1)
                    .toString();
                path.setAttribute(`d`, d);
            }
            */
        }

        return svg;

    }

    static _rAtts(p_el, p_atts) {
        for (let i = 0; i < p_atts.length; i++) { p_el.removeAttribute(p_atts[i]); }
    }

    static _rAttsOnTag(p_el, p_tag, p_atts) {
        let children = p_el.getElementsByTagName(p_tag);
        for (let i = 0; i < children.length; i++) { this._rAtts(children[i], p_atts); }
    }

    //#endregion

    //#region SVG Font processing

    static SVGFontFromSubFamily(p_subFamily) {

        let XML = svgFontRef.cloneNode(true),
            FontFace = XML.getElementsByTagName(`font-face`)[0],
            FontFaceSrc = XML.getElementsByTagName(`font-face-src`)[0],
            FontFaceSrcName = XML.getElementsByTagName(`font-face-src-name`)[0],
            MissingGlyph = XML.getElementsByTagName(`missing-glyph`)[0];

        // Font ID = complete font name. Family + SubFamily Name

    }

    //#endregion

    //#region TTF processing

    static FamilyFromTTF(p_ttfBytes) {

        let
            svgFont = domparser.parseFromString(ttf2svg(p_ttfBytes), `image/svg+xml`),
            fontFace = svgFont.getElementsByTagName(`font-face`)[0],
            glyphs = svgFont.getElementsByTagName(`glyph`);

        //console.log(svgFont);

        let
            family = new mkfData.Family(),
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

            let newGlyph = new mkfData.Glyph(),
                defg = newGlyph._defaultGlyph;

            if (glyphAdvX != fontAdvx) { defg.Set(IDS.WIDTH, glyphAdvX); }
            //if (glyphAdvY != fontAdvy) { defg.Set(IDS.HEIGHT, glyphAdvY); }

            // Flip & translate glyph
            glyphPath = svgpath(glyphPath)
                .scale(1, -1)
                .translate(0, ascent)
                .toString();


            family.AddGlyph(newGlyph);

            newGlyph.BatchSet({
                [IDS.GLYPH_NAME]: glyphId,
                [IDS.UNICODE]: glyphUnicode,
                [IDS.DECIMAL]: glyphUnicode.length == 1 ? glyphUnicode.charCodeAt(0) : -1
            });

            defg.Set(IDS.PATH, glyphPath);

        }

        // Sort according to decimal value
        family.catalog.Sort({ fn: (a, b) => { return a.data.decimal - b.data.decimal; } });

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

    static TTFFontFromSubFamily(p_subFamily) {

        var VERSION_RE = /^(Version )?(\d+[.]\d+)$/i;

        let options = {
            familyname: p_subFamily.Resolve(IDS.FAMILY),
            subfamilyname: p_subFamily.Resolve(IDS.FONT_STYLE),
            copyright: p_subFamily.Resolve(IDS.COPYRIGHT) || ``,
            description: p_subFamily.Resolve(IDS.DESCRIPTION) || ``,
            url: p_subFamily.Resolve(IDS.URL) || ``,
            version: `Version ${p_subFamily.Resolve(IDS.VERSION) || '1.0'}`
        }

        console.log(options);

        let ttf = svg2ttf(p_subFamily.fontObject.outerHTML, options);
        return ttf.buffer; // For file writing, do Buffer.from(ttf.buffer)
    }

    //#endregion


}

module.exports = SVGOperations;
