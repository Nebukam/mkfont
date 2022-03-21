const nkm = require(`@nkmjs/core`);
const css = nkm.style.CSS;
const IDS = require(`../data/ids`);
const ENUMS = require(`../data/enums`);
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

//#region getBBox hack

const _getBBox = SVGGraphicsElement.prototype.getBBox;
const __dummyDiv = document.createElement("div");
__dummyDiv.setAttribute("style", "position:absolute; visibility:hidden; width:0; height:0");
const __dummySVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
__dummyDiv.appendChild(__dummySVG);
document.body.appendChild(__dummyDiv);
const __pathSVG = document.createElementNS("http://www.w3.org/2000/svg", "path");

SVGGraphicsElement.prototype.getBBox = function () {
    var rect;
    if (document.contains(this)) {
        rect = _getBBox.apply(this);
    } else {

        if (this.tagName === "svg") {
            __dummyDiv.appendChild(this);
            rect = _getBBox.apply(this);
        } else {
            __dummySVG.appendChild(this);
            rect = _getBBox.apply(__dummySVG);
        }
        this.remove();
    }

    let result = {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.y,
        bottom: rect.y + rect.height,
        left: rect.x,
        right: rect.x + rect.width
    };

    return result;

};

//#endregion

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

        if (!p_input) { return result; }

        try {

            let svg = domparser.parseFromString(
                optimize(p_input, svgopts).data, `image/svg+xml`).getElementsByTagName(`svg`)[0];

            //console.log(svg);

            let
                paths = svg.getElementsByTagName(`path`),
                mergedPaths = ``,
                markedBBox = null,
                markPath = null;

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
                    if (!markedBBox) {
                        markedBBox = this._FindMarkedBBox(p, styleObject, markCol);
                        if (markedBBox) { d = null; }
                    }

                    if (d) { mergedPaths += `${mergedPaths.length > 0 ? ' ' : ''}${d}`; }

                }

            }

            if (mergedPaths && mergedPaths != ``) {

                result.markedBBox = markedBBox;

                if (markedBBox) {
                    result.width = markedBBox.width;
                    result.height = markedBBox.height;

                    //Move path so top left is at 0;0
                    mergedPaths = svgpath(mergedPaths)
                        .translate(-markedBBox.x, -markedBBox.y)
                        .toString();

                    result.path = mergedPaths;
                    result.BBox = this.GetBBox(mergedPaths);

                } else {

                    result.path = mergedPaths;
                    result.BBox = this.GetBBox(mergedPaths);

                    let viewBox = svg.getAttribute(`viewBox`);

                    if (viewBox) {
                        let vbSplit = viewBox.split(` `);
                        result.width = Number(vbSplit[2]);
                        result.height = Number(vbSplit[3]);
                    } else {
                        let
                            wAtt = Number(svg.getAttribute(`width`)),
                            hAtt = Number(svg.getAttribute(`height`));

                        result.width = Number.isNaN(wAtt) ? result.BBox.width : wAtt;
                        result.height = Number.isNaN(hAtt) ? result.BBox.height : hAtt;
                    }
                }

                result.exists = true;

            }

        } catch (e) { console.log(e); }

        return result;
    }

    static EmptySVGStats() {

        let
            path = `M 0 0 L 0 0 z`,
            result = {
                exists: true,
                markedBBox: false,
                path: path,
                BBox: this.GetBBox(path),
                width: 0,
                height: 0,
                emptyPath: true
            };

        return result;
    }

    static _FindMarkedBBox(p_path, p_style, p_markCol) {

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

        if (foundRef) { return p_path.getBBox(); }

        return false;

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

        __pathSVG.setAttribute(`d`, p_path);
        return __pathSVG.getBBox();

    }

    static TranslateBBox(p_bbox, p_trx, p_try = 0) {
        p_bbox.x = p_bbox.x + p_trx;
        p_bbox.y = p_bbox.y + p_try;
        p_bbox.top = p_bbox.y;
        p_bbox.bottom = p_bbox.y + p_bbox.height;
        p_bbox.left = p_bbox.x;
        p_bbox.right = p_bbox.x + p_bbox.width;
    }

    static FitPath(p_settings, p_context, p_svgStats) {

        let path = p_svgStats.path,
            refMode = p_settings.Get(IDS.TR_BOUNDS_MODE),
            sShift = p_settings.Resolve(IDS.TR_WIDTH_SHIFT),
            sPush = p_settings.Resolve(IDS.TR_WIDTH_PUSH),
            mono = p_context.mono;

        if (p_svgStats.emptyPath) {
            return {
                height: 0,
                width: Math.max(sShift + sPush, 0),
                path: p_svgStats.path,
                bbox: p_svgStats.BBox
            };
        }

        let
            bbox = p_svgStats.BBox,
            markedBBox = p_svgStats.markedBBox,
            scale = 1,
            heightRef = p_svgStats.height,
            widthRef = p_svgStats.width,
            wOff = p_settings.Get(IDS.TR_WIDTH_PUSH),
            offsetY = 0,
            offsetX = 0;

        if (refMode == ENUMS.BOUNDS_INSIDE) {
            heightRef = bbox.height;
            widthRef = bbox.width;
            path = svgpath(path)
                .translate(-bbox.x, -bbox.y)
                .toString();
        } else if (refMode == ENUMS.BOUNDS_MIXED) {
            widthRef = bbox.width;
            path = svgpath(path)
                .translate(-bbox.x, 0)
                .toString();
        }


        switch (p_settings.Get(IDS.TR_SCALE_MODE)) {
            case ENUMS.SCALE_EM:
                scale = p_context.em / heightRef;
                break;
            case ENUMS.SCALE_BASELINE:
                scale = p_context.asc / heightRef;
                break;
            case ENUMS.SCALE_SPREAD:
                scale = (p_context.asc - p_context.dsc) / heightRef;
                break;
            case ENUMS.SCALE_HEIGHT:
                scale = p_context.h / heightRef;
                break;
            case ENUMS.SCALE_MANUAL:
                scale = p_settings.Resolve(IDS.TR_SCALE_FACTOR);
                break;
            default:
            case ENUMS.SCALE_NONE:
                break;
        }

        heightRef *= scale; widthRef *= scale;

        // V align

        switch (p_settings.Get(IDS.TR_VER_ALIGN)) {
            case ENUMS.VALIGN_BASELINE:
                offsetY = p_context.asc - heightRef;
                break;
            case ENUMS.VALIGN_DESC:
                offsetY = (p_context.asc - p_context.dsc) - heightRef;
                break;
            case ENUMS.VALIGN_SPREAD:
                offsetY = p_context.em * 0.5 - heightRef;
                break;
            default:
            case ENUMS.VALIGN_TOP:
                offsetY = -heightRef;
                break;
        }

        switch (p_settings.Get(IDS.TR_VER_ALIGN_ANCHOR)) {
            case ENUMS.VANCHOR_BOTTOM:
                offsetY += 0;
                break;
            case ENUMS.VANCHOR_CENTER:
                offsetY += heightRef * 0.5;
                break;
            default:
            case ENUMS.VANCHOR_TOP:
                offsetY += heightRef;
                break;
        }


        // H align

        let hAlign = p_settings.Get(IDS.TR_HOR_ALIGN);
        if (hAlign == ENUMS.HALIGN_XMIN) {
            if (Math.abs(wOff) < 1.00001) { widthRef += widthRef * wOff; }
            else { widthRef += wOff; }
        }

        switch (p_settings.Get(IDS.TR_HOR_ALIGN_ANCHOR)) {
            case ENUMS.HANCHOR_LEFT:
                offsetX += 0;
                break;
            case ENUMS.HANCHOR_CENTER:
                offsetX -= widthRef * 0.5;
                break;
            default:
            case ENUMS.HANCHOR_RIGHT:
                offsetX -= widthRef;
                break;
        }

        if (mono) { widthRef = p_context.w; }

        switch (hAlign) {
            case ENUMS.HALIGN_XMIN:
                offsetX += sShift;
                widthRef += sShift + sPush;
                break;
            case ENUMS.HALIGN_SPREAD:
                widthRef = p_context.w;
                offsetX += widthRef * 0.5;
                break;
            default:
            case ENUMS.HALIGN_XMAX:
                widthRef = p_context.w;
                offsetX += widthRef;
                break;
        }

        path = svgpath(path)
            .scale(scale)
            .translate(offsetX, offsetY)
            .toString();

        return {
            height: Math.max(heightRef, 0),
            width: Math.max(widthRef, 0),
            path: path,
            bbox: this.GetBBox(path)
        };

    }

    static ScalePathData(p_pathData, p_scale) {
        p_pathData.width *= p_scale;
        p_pathData.height *= p_scale;
        p_pathData.path = svgpath(p_pathData.path).scale(p_scale, p_scale).toString();
        let bbox = p_pathData.BBox;
        bbox.x *= p_scale;
        bbox.y *= p_scale;
        bbox.width *= p_scale;
        bbox.height *= p_scale;
        bbox.left = bbox.x;
        bbox.top = bbox.y;
        bbox.right = bbox.x + bbox.width;
        bbox.bottom = bbox.y + bbox.height;
    }

    //#endregion

}

globalThis.SVGOPS = module.exports = SVGOperations;
