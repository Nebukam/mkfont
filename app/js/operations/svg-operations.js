/*const nkm = require(`@nkmjs/core`);*/
const css = nkm.style.CSS;
const mkfData = require(`../data`);
const IDS = mkfData.IDS;
const UNICODE = require(`../unicode`);

const { optimize } = require('svgo');
const ttf2svg = require('ttf2svg');
const svg2ttf = require('svg2ttf');
const svgpath = require('svgpath');

const domparser = new DOMParser();
const svgopts = {
    multipass: true,
    plugins: [
        `preset-default`,
        `convertPathData`,
        { name: `convertShapeToPath`, params: { convertArcs: true } },
        { name: `convertPathData`, params: { applyTransforms: true } }
    ]
};

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

    //#region SVG Data processing

    /**
     * Return an SVG object with important informations
     * if they are found.
     * @param {*} p_input 
     * @returns 
     */
    static SVGStats(p_input, p_markCol = `FF00FF`) {
        let result = { exists: false };

        if(!p_input){ return result; }

        try {

            let svg = domparser.parseFromString(
                optimize(p_input, svgopts).data, `image/svg+xml`).getElementsByTagName(`svg`)[0];

            //console.log(svg);

            let
                paths = svg.getElementsByTagName(`path`),
                mergedPaths = ``,
                markBBox = null;

            if (paths.length > 0) {

                p_markCol = p_markCol.toLowerCase();

                let
                    markCol = p_markCol[0] == `#` ? p_markCol.substring(1) : p_markCol,
                    style = svg.getElementsByTagName(`style`)[0],
                    styleObject = style ? css.ClassCSS(style.innerHTML) : {};

                for (let i = 0; i < paths.length; i++) {

                    let p = paths[i],
                        d = p.getAttribute(`d`),
                        tr = p.getAttribute(`transform`);

                    //Attempt to apply transforms that can be applied
                    if (tr) { p.setAttribute(`d`, svgpath(d).transform(tr).toString()); }

                    //Check if path is mark (if so remove it)
                    if (!markBBox) {
                        markBBox = this._FindMarkBBox(p, styleObject, markCol);
                        if (markBBox) { d = null; }
                    }

                    if (d) { mergedPaths += `${mergedPaths.length > 0 ? ' ' : ''}${d}`; }

                }

            }

            if (mergedPaths && mergedPaths != ``) {

                result.path = mergedPaths;
                result.bbox = markBBox;

                let viewBox = svg.getAttribute(`viewBox`);
                if(viewBox){
                    let vbSplit = viewBox.split(` `);
                    result.width = vbSplit[2];
                    result.height = vbSplit[3];
                }else{
                    result.width = svg.getAttribute(`width`);
                    result.height = svg.getAttribute(`height`);
                }

                result.exists = true;

            }

        } catch (e) { console.log(e); }

        return result;
    }

    static bbox = { maxx: 0, minx: 0, maxy: 0, miny: 0, width: 0, height: 0 };

    static _FindMarkBBox(p_path, p_style, p_markCol) {

        let
            A = `#${p_markCol}`,
            B = p_markCol.length == 6 ? `#${p_markCol[0]}${p_markCol[2]}${p_markCol[4]}` : A,
            inlineStyle = p_path.getAttribute(`style`),
            classStyle = `.${p_path.getAttribute(`class`)}`,
            fillStyle = p_path.getAttribute(`fill`),
            strokeStyle = p_path.getAttribute(`stroke`),
            foundRef = false;

        if (classStyle && classStyle in p_style) {
            for (let c in p_style[classStyle]) {
                let refValue = p_style[classStyle][c];
                if (refValue == A || refValue == B) {
                    foundRef = true;
                    break;
                }
            }
        }

        if (!foundRef && inlineStyle) {
            let inlineObj = css.Rules(inlineStyle);
            for (let c in inlineObj) {
                let refValue = inlineObj[c];
                if (refValue == A || refValue == B) { foundRef = true; break; }
            }
        }

        if (!foundRef && (fillStyle == A || fillStyle == B)) { foundRef = true; }
        if (!foundRef && (strokeStyle == A || strokeStyle == B)) { foundRef = true; }

        if (foundRef) { return this.GetBBox(p_path.getAttribute(`d`)); }

        return false;

    }

    //#endregion

    //#region TTF processing

    static FamilyFromTTF(p_ttfBytes) {

        let
            svgFont = domparser.parseFromString(ttf2svg(p_ttfBytes), `image/svg+xml`),
            fontFace = svgFont.getElementsByTagName(`font-face`)[0],
            glyphs = svgFont.getElementsByTagName(`glyph`);

        console.log(ttf2svg(p_ttfBytes));

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

    //#region transforms

    /**
     * 
     * @param {*} p_subFamily 
     * @param {*} p_fn ( svgpath ) => { return svgpath.op().op(); }
     */
    static TransformAll(p_subFamily, p_fn) {

        let arr = p_subFamily.family._glyphs.internalArray;
        for (let i = 0, n = arr.length; i < n; i++) {

            let
                g = arr[i].GetVariant(p_subFamily),
                d = p_fn(svgpath(g.Get(IDS.PATH))).toString();

            g.Set(IDS.PATH, d);

        }
    }

    static GetBBox(p_path) {

        this.bbox.minx = this.bbox.miny = 99999999;
        this.bbox.maxx = this.bbox.maxy = -99999999;

        svgpath(p_path).iterate((segment, index, x, y) => {
            if(segment[0] === 'M'){ return; }
            this.bbox.minx = Math.min(x, this.bbox.minx);
            this.bbox.maxx = Math.max(x, this.bbox.maxx);
            this.bbox.miny = Math.min(y, this.bbox.miny);
            this.bbox.maxy = Math.max(y, this.bbox.maxy);
        });

        this.bbox.width = this.bbox.maxx - this.bbox.minx;
        this.bbox.height = this.bbox.maxy - this.bbox.miny;

        return { ...this.bbox };

    }

    //#endregion

}

module.exports = SVGOperations;
