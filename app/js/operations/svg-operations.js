'use strict';

const nkm = require(`@nkmjs/core`);
const css = nkm.style.CSS;
const IDS = require(`../data/ids`);
const ENUMS = require(`../data/enums`);
const UNICODE = require(`../unicode`);

const { optimize } = require('svgo');
const ttf2svg = require('ttf2svg');
const svg2ttf = require('svg2ttf');
const svgpath = require('svgpath');
const svgpathreverse = require('svg-path-reverse');

const domparser = new DOMParser();
/*
const svgopts = {
    multipass: true,
    plugins: [
        //`preset-default`,
        //`convertPathData`,
        { name: `convertShapeToPath`, params: { convertArcs: true } },
        { name: `convertPathData`, params: { applyTransforms: true } }
    ]
};
*/

const svgopts = {
    multipass: true,
    plugins: [
        {
            name: `convertShapeToPath`, params: {
                convertArcs: true,
                precision: 6,
            }
        },
        {
            name: `convertPathData`, params: {
                applyTransforms: true,
                applyTransformsStroked: true,
                makeArcs: {
                    threshold: 2.5, // coefficient of rounding error
                    tolerance: 0.01, // percentage of radius
                },
                straightCurves: false, //true
                lineShorthands: false, //true
                curveSmoothShorthands: false, //true
                floatPrecision: 6,
                transformPrecision: 10,
                removeUseless: false, //true
                collapseRepeated: false, //true
                utilizeAbsolute: true, //true
                leadingZero: false, //true
                negativeExtraSpace: false, //true
                noSpaceAfterFlags: false, // a20 60 45 0 1 30 20 → a20 60 45 0130 20
                forceAbsolutePath: false,
            }
        }
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
__dummySVG.appendChild(__pathSVG);

SVGGraphicsElement.prototype.getBBox = function () {
    var rect;
    if (document.contains(this)) {
        rect = _getBBox.apply(this);
    } else {

        let prevParent = this.parentNode;
        if (this.tagName === "svg") {
            __dummyDiv.appendChild(this);
            rect = _getBBox.apply(this);
        } else {
            __dummySVG.appendChild(this);
            rect = _getBBox.apply(__dummySVG);
        }
        if (prevParent) { prevParent.appendChild(this); }
        else { this.remove(); }
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


    static ATT_PATH = `d`;
    static ATT_EM_UNITS = `units-per-em`;
    static ATT_CAP_HEIGHT = `cap-height`;
    static ATT_X_HEIGHT = `x-height`;
    static ATT_ASCENT = `ascent`;
    static ATT_DESCENT = `descent`;
    static ATT_HANGING = `hanging`;
    static ATT_UNDERLINE_THICKNESS = `underline-thickness`;
    static ATT_UNDERLINE_POSITION = `underline-position`;
    static ATT_H_ORIGIN_X = 'horiz-origin-x';
    static ATT_H_ORIGIN_Y = 'horiz-origin-y';
    static ATT_H_ADVANCE = `horiz-adv-x`;
    static ATT_V_ORIGIN_X = 'vert-origin-x';
    static ATT_V_ORIGIN_Y = 'vert-origin-y';
    static ATT_V_ADVANCE = `vert-adv-y`;
    static ATT_WEIGHT_CLASS = `font-weight`;
    static ATT_GLYPH_NAME = `glyph-name`;
    static ATT_UNICODE = `unicode`;

    static GetAttId(p_id) { return this.ATT_MAPPING[p_id]; }

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

            let svg = domparser.parseFromString(optimize(p_input, svgopts).data, `image/svg+xml`).getElementsByTagName(`svg`)[0];

            //let svg = domparser.parseFromString(p_input, `image/svg+xml`).getElementsByTagName(`svg`)[0];
            //console.log(optimize(p_input, svgopts).data, svg);


            let
                paths = svg.getElementsByTagName(`path`),
                texts = svg.getElementsByTagName(`text`),
                mergedPaths = ``,
                markedBBox = null,
                markPath = null;

            if (texts.length > 0) {
                for (let i = 0; i < texts.length; i++) {
                    let textContent = texts[i].textContent;
                    if (textContent && textContent != ``) {
                        if (!result.layers) { result.layers = []; }
                        if (!result.layers.includes(textContent)) { result.layers.push(textContent); }
                    }
                }
            }

            if (paths.length > 0) {

                let pathArray = [];
                // Copy past to avoid paths from being mutated as we check for bbox.
                for (let i = 0; i < paths.length; i++) { pathArray.push(paths[i]); }

                p_markCol = p_markCol.toLowerCase();

                let
                    markCol = p_markCol[0] == `#` ? p_markCol.substring(1) : p_markCol,
                    style = svg.getElementsByTagName(`style`)[0],
                    styleObject = style ? css.ClassCSS(style.innerHTML) : {};

                for (let i = 0; i < pathArray.length; i++) {

                    let p = pathArray[i],
                        d = p.getAttribute(`d`),
                        tr = p.getAttribute(`transform`);

                    //Attempt to apply transforms that can be applied
                    if (tr) {
                        d = svgpath(d).transform(tr).toString();
                        p.setAttribute(`d`, d);
                    }


                    let tbb = this.GetBBox(d);
                    if (tbb.width == 0 && tbb.height == 0) { d = null; }

                    //Check if path is mark (if so ignore it)
                    if (d && !markedBBox) {
                        markedBBox = this._FindMarkedBBox(p, styleObject, markCol);
                        if (markedBBox) {
                            d = null;
                        }
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
                    result.bbox = this.GetBBox(mergedPaths);


                } else {

                    result.path = mergedPaths;
                    result.bbox = this.GetBBox(mergedPaths);

                    let viewBox = svg.getAttribute(`viewBox`);

                    if (viewBox) {
                        let vbSplit = viewBox.split(` `);
                        result.width = Number(vbSplit[2]);
                        result.height = Number(vbSplit[3]);
                    } else {
                        let
                            wAtt = Number(svg.getAttribute(`width`)),
                            hAtt = Number(svg.getAttribute(`height`));

                        result.width = Number.isNaN(wAtt) ? result.bbox.width : wAtt;
                        result.height = Number.isNaN(hAtt) ? result.bbox.height : hAtt;
                    }
                }

                result.exists = true;

            } else {

            }


        } catch (e) { console.log(e); }

        return result;
    }

    static EmptySVGStats() {

        let
            path = IDS.EMPTY_PATH_CONTENT,
            result = {
                exists: true,
                markedBBox: false,
                path: path,
                bbox: this.GetBBox(path),
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
            C = `#b9529f`, //CMYK magenta -_-
            inlineStyle = p_path.getAttribute(`style`),
            classStyle = `.${p_path.getAttribute(`class`)}`,
            fillStyle = p_path.getAttribute(`fill`),
            strokeStyle = p_path.getAttribute(`stroke`),
            foundRef = false;

        if (classStyle && classStyle in p_style) {
            for (let c in p_style[classStyle]) {
                try {
                    let refValue = p_style[classStyle][c].toLowerCase();
                    if (refValue == A || refValue == B || refValue == C) {
                        foundRef = true;
                        break;
                    }
                } catch (e) { }
            }
        }

        if (!foundRef && inlineStyle) {
            let lwrc = inlineStyle.toLowerCase();
            if (lwrc.includes(A) || lwrc.includes(B) || lwrc.includes(C)) { foundRef = true; }
            /*
            let inlineObj = css.Rules(inlineStyle);
            for (let c in inlineObj) {
                let refValue = inlineObj[c];
                if (refValue == A || refValue == B) { foundRef = true; break; }
            }
            */
        }

        if (!foundRef && (fillStyle == A || fillStyle == B || fillStyle == C)) { foundRef = true; }
        if (!foundRef && (strokeStyle == A || strokeStyle == B || strokeStyle == C)) { foundRef = true; }

        if (foundRef) {
            return this.GetBBox(p_path.getAttribute(`d`));
        }

        return false;

    }

    static FlatSVGStats(p_path, p_computedPath, p_context, p_w, p_h) {

        if (IDS.isEmptyPathContent(p_path)) { return this.EmptySVGStats(); }

        let
            bbox = this.GetBBox(p_path),
            path = p_path,
            fit = p_computedPath.fit,
            fMode = fit ? p_context.Get(IDS.FLATTEN_MODE) : ENUMS.FLATTEN_FIT,
            outW = bbox.width,
            outH = bbox.height;

        switch (fMode) {
            case ENUMS.FLATTEN_SMART:
                outH = fit.height;
                path = svgpath(p_path).translate(-bbox.x, fit.y).toString();
                this.TranslateBBox(bbox, -bbox.x, fit.y);
                break;
            default:
            case ENUMS.FLATTEN_FIT:
                path = svgpath(p_path).translate(-bbox.x, -bbox.y).toString();
                this.TranslateBBox(bbox, -bbox.x, -bbox.y);
                break;
        }

        return {
            width: outW,
            height: outH,
            path: path,
            bbox: this.GetBBox(path)
        };
    }

    //#endregion

    //#region transforms

    static GetBBox(p_path) {

        __pathSVG.setAttribute(`d`, p_path);
        return __dummySVG.getBBox();

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
            yUserOffset = p_settings.Resolve(IDS.TR_Y_OFFSET),
            autoWidth = p_settings.Get(IDS.TR_AUTO_WIDTH),
            ctxH = p_settings.ResolveVariant(IDS.HEIGHT, p_context.h),
            ctxW = p_settings.ResolveVariant(IDS.WIDTH, p_context.w),
            mono = p_context.mono,
            mirror = p_settings.Get(IDS.TR_MIRROR),
            rot = p_settings.Resolve(IDS.TR_ROTATION),
            skx = p_settings.Resolve(IDS.TR_SKEW_X),
            sky = p_settings.Resolve(IDS.TR_SKEW_Y),
            doReverse = false;

        if (sShift == null) { sShift = p_context.xshift; }
        if (sPush == null) { sPush = p_context.xpush; }

        if (p_svgStats.emptyPath) {

            let eSVG = {
                height: ctxH,
                width: 0,
                path: p_svgStats.path,
                bbox: p_svgStats.bbox,
                fit: { x: 0, y: 0, width: ctxW, height: ctxH },
            };

            if (autoWidth) { eSVG.width = Math.max(sShift + sPush, 0); }
            else { eSVG.width = ctxW; }

            if (mono) { eSVG.width = p_context.w; }

            return eSVG;

        }

        let
            pathTransform = svgpath(path),
            bbox = p_svgStats.bbox,
            scale = 1,
            heightRef = p_svgStats.height,
            widthRef = p_svgStats.width,
            offsetY = 0,
            offsetX = 0,
            fitH = heightRef,
            fitW = widthRef,
            anchor = p_settings.Get(IDS.TR_ANCHOR);

        if (rot != 0 || skx != 0 || sky != 0) {
            //rotate incoming SVG Path & update bbox

            let
                rotorder = p_settings.Resolve(IDS.TR_SKEW_ROT_ORDER),
                ranchor = p_settings.Resolve(IDS.TR_ROTATION_ANCHOR),
                tr = pathTransform;

            switch (rotorder) {
                case ENUMS.SKR_ORDER_R_X_Y: this._Rot(tr, rot, ranchor, widthRef, heightRef); this._SkewX(tr, skx); this._SkewY(tr, sky); break;
                case ENUMS.SKR_ORDER_R_Y_X: this._Rot(tr, rot, ranchor, widthRef, heightRef); this._SkewY(tr, sky); this._SkewX(tr, skx); break;
                case ENUMS.SKR_ORDER_X_R_Y: this._SkewX(tr, skx); this._Rot(tr, rot, ranchor, widthRef, heightRef); this._SkewY(tr, sky); break;
                case ENUMS.SKR_ORDER_Y_R_X: this._SkewY(tr, sky); this._Rot(tr, rot, ranchor, widthRef, heightRef); this._SkewX(tr, skx); break;
                case ENUMS.SKR_ORDER_X_Y_R: this._SkewX(tr, skx); this._SkewY(tr, sky); this._Rot(tr, rot, ranchor, widthRef, heightRef); break;
                case ENUMS.SKR_ORDER_Y_X_R: this._SkewY(tr, sky); this._SkewX(tr, skx); this._Rot(tr, rot, ranchor, widthRef, heightRef); break;
            }

            if (refMode == ENUMS.BOUNDS_INSIDE || refMode == ENUMS.BOUNDS_MIXED_VER) {
                // This alone, super expensive ;_;
                bbox = this.GetBBox(pathTransform.toString());
            }

        }

        switch (refMode) {
            case ENUMS.BOUNDS_INSIDE:
                fitH = heightRef = bbox.height;
                fitW = widthRef = bbox.width;
                pathTransform.translate(-bbox.x, -bbox.y);
                break;
            case ENUMS.BOUNDS_MIXED_VER:
                fitW = widthRef = bbox.width;
                pathTransform.translate(-bbox.x, 0);
                break;
            case ENUMS.BOUNDS_MIXED_HOR:
                fitH = heightRef = bbox.height;
                pathTransform.translate(0, -bbox.y);
                break;
        }

        if (mirror != ENUMS.MIRROR_NONE) {

            switch (mirror) {
                case ENUMS.MIRROR_H:
                    pathTransform.scale(-1, 1).translate(fitW, 0);
                    doReverse = true;
                    break;
                case ENUMS.MIRROR_V:
                    pathTransform.scale(1, -1).translate(0, fitH);
                    doReverse = true;
                    break;
                case ENUMS.MIRROR_H_AND_V:
                    pathTransform.scale(-1, -1).translate(fitW, fitH);
                    break;
            }
        }


        switch (p_settings.Get(IDS.TR_SCALE_MODE)) {
            case ENUMS.SCALE_EM:
                scale = p_context.em / heightRef;
                break;
            case ENUMS.SCALE_ASCENDER:
                scale = p_context.asc / heightRef;
                break;
            case ENUMS.SCALE_SPREAD:
                scale = (p_context.asc - p_context.dsc) / heightRef;
                break;
            case ENUMS.SCALE_X_HEIGHT:
                scale = p_context.xh / heightRef;
                break;
            case ENUMS.SCALE_CAP_HEIGHT:
                scale = p_context.ch / heightRef;
                break;
            case ENUMS.SCALE_HEIGHT:
                scale = ctxH / heightRef;
                break;
            case ENUMS.SCALE_MANUAL:
                scale = p_settings.Resolve(IDS.TR_SCALE_FACTOR);
                break;
            case ENUMS.SCALE_NORMALIZE:

                let
                    nrmfctr = p_settings.Get(IDS.TR_NRM_FACTOR),
                    hra = fitH / ctxH,
                    wra = fitW / ctxW;

                if (hra > wra) {
                    hra = fitH / (ctxH + (ctxH * nrmfctr));
                    scale = 1 / hra;
                } else {
                    wra = fitW / (ctxW + (ctxW * nrmfctr));
                    scale = 1 / wra;
                }

                autoWidth = false;
                break;
            default:
            case ENUMS.SCALE_NONE:
                break;
        }

        heightRef *= scale; widthRef *= scale;
        fitH *= scale; fitW *= scale;

        // V align

        switch (p_settings.Get(IDS.TR_VER_ALIGN)) {
            default:
            case ENUMS.VALIGN_BASELINE:
                offsetY = p_context.bsl - heightRef;
                break;
            case ENUMS.VALIGN_DESC:
                offsetY = (p_context.asc - p_context.dsc) - heightRef;
                break;
            case ENUMS.VALIGN_SPREAD:
                offsetY = p_context.em * 0.5 - heightRef;
                break;
            case ENUMS.VALIGN_ASCENDER:
                offsetY = p_context.bsl - heightRef - p_context.asc;
                break;
            case ENUMS.VALIGN_EM:
                offsetY = p_context.em - heightRef;
                break;
        }



        switch (anchor) {
            case ENUMS.ANCHOR_BOTTOM_LEFT:
            case ENUMS.ANCHOR_BOTTOM:
            case ENUMS.ANCHOR_BOTTOM_RIGHT:
                offsetY += 0;
                break;
            case ENUMS.ANCHOR_LEFT:
            case ENUMS.ANCHOR_CENTER:
            case ENUMS.ANCHOR_RIGHT:
                offsetY += heightRef * 0.5;
                break;
            default:
            case ENUMS.ANCHOR_TOP_LEFT:
            case ENUMS.ANCHOR_TOP:
            case ENUMS.ANCHOR_TOP_RIGHT:
                offsetY += heightRef;
                break;
        }


        // H align

        if (autoWidth) { widthRef += sShift + sPush; }
        else { widthRef = ctxW; }

        if (mono) { widthRef = p_context.w; }

        switch (anchor) {
            case ENUMS.ANCHOR_TOP_LEFT:
            case ENUMS.ANCHOR_LEFT:
            case ENUMS.ANCHOR_BOTTOM_LEFT:
                offsetX += 0;
                break;
            case ENUMS.ANCHOR_TOP:
            case ENUMS.ANCHOR_CENTER:
            case ENUMS.ANCHOR_BOTTOM:
                offsetX -= fitW * 0.5;
                break;
            default:
            case ENUMS.ANCHOR_TOP_RIGHT:
            case ENUMS.ANCHOR_RIGHT:
            case ENUMS.ANCHOR_BOTTOM_RIGHT:
                offsetX -= fitW;
                break;
        }

        switch (p_settings.Get(IDS.TR_HOR_ALIGN)) {
            case ENUMS.HALIGN_XMIN:
                offsetX += sShift;
                break;
            case ENUMS.HALIGN_SPREAD:
                offsetX += widthRef * 0.5;
                break;
            default:
            case ENUMS.HALIGN_XMAX:
                offsetX += widthRef - sPush;
                break;
        }

        offsetY += yUserOffset;

        path = pathTransform
            .scale(scale)
            .translate(offsetX, offsetY)
            .toString();

        if (doReverse) { path = svgpathreverse.reverse(path); }

        return {
            height: Math.max(heightRef, 0),
            width: Math.max(widthRef, 0),
            fit: { width: fitW, height: fitH, x: offsetX, y: offsetY, yoff: yUserOffset },
            path: path,
            bbox: this.GetBBox(path)
        };

    }

    static FitLayerPath(p_settings, p_context, p_variant, p_layerPath) {

        let
            path = p_layerPath, //may be inverted prior to fitting
            layerCP = p_variant._computedPath,
            fit = p_context.fit,
            ctxW = p_context.width,
            ctxH = p_context.height,
            lyrWidth = layerCP.width,
            lyrHeight = layerCP.height,
            offsetX = fit.x,
            offsetY = fit.y,
            scale = 1,
            mirror = p_settings.Get(IDS.TR_MIRROR),
            rot = p_settings.Get(IDS.TR_ROTATION),
            skx = p_settings.Get(IDS.TR_SKEW_X),
            sky = p_settings.Get(IDS.TR_SKEW_Y),
            boundMode = p_settings.Get(IDS.TR_BOUNDS_MODE),
            pathTransform = svgpath(path),
            doReverse = false;

        if (rot != 0 || skx != 0 || sky != 0) {
            //rotate incoming SVG Path & update bbox

            let
                rotorder = p_settings.Get(IDS.TR_SKEW_ROT_ORDER),
                ranchor = p_settings.Get(IDS.TR_ROTATION_ANCHOR),
                tr = pathTransform;

            switch (rotorder) {
                case ENUMS.SKR_ORDER_R_X_Y: this._Rot(tr, rot, ranchor, lyrWidth, lyrHeight); this._SkewX(tr, skx); this._SkewY(tr, sky); break;
                case ENUMS.SKR_ORDER_R_Y_X: this._Rot(tr, rot, ranchor, lyrWidth, lyrHeight); this._SkewY(tr, sky); this._SkewX(tr, skx); break;
                case ENUMS.SKR_ORDER_X_R_Y: this._SkewX(tr, skx); this._Rot(tr, rot, ranchor, lyrWidth, lyrHeight); this._SkewY(tr, sky); break;
                case ENUMS.SKR_ORDER_Y_R_X: this._SkewY(tr, sky); this._Rot(tr, rot, ranchor, lyrWidth, lyrHeight); this._SkewX(tr, skx); break;
                case ENUMS.SKR_ORDER_X_Y_R: this._SkewX(tr, skx); this._SkewY(tr, sky); this._Rot(tr, rot, ranchor, lyrWidth, lyrHeight); break;
                case ENUMS.SKR_ORDER_Y_X_R: this._SkewY(tr, sky); this._SkewX(tr, skx); this._Rot(tr, rot, ranchor, lyrWidth, lyrHeight); break;
            }

        }

        switch (p_settings.Get(IDS.TR_LYR_BOUNDS_MODE)) {
            case ENUMS.BOUNDS_INSIDE:
                offsetX += p_context.bbox.x-fit.x;
                offsetY += p_context.bbox.y-fit.y;
                ctxW = p_context.bbox.width;
                ctxH = p_context.bbox.height;
                break;
            case ENUMS.BOUNDS_MIXED_VER:
                offsetX += p_context.bbox.x-fit.x;
                ctxW = p_context.bbox.width;
                break;
            case ENUMS.BOUNDS_MIXED_HOR:
                offsetY += p_context.bbox.y-fit.y;
                ctxH = p_context.bbox.height;
                break;
        }

        if (boundMode != ENUMS.BOUNDS_OUTSIDE) {
            let vbbox = this.GetBBox(pathTransform.toString());
            switch (boundMode) {
                case ENUMS.BOUNDS_INSIDE:
                    pathTransform.translate(-vbbox.x, -vbbox.y);
                    lyrWidth = vbbox.width;
                    lyrHeight = vbbox.height;
                    break;
                case ENUMS.BOUNDS_MIXED_VER:
                    pathTransform.translate(-vbbox.x, 0);
                    lyrWidth = vbbox.width;
                    break;
                case ENUMS.BOUNDS_MIXED_HOR:
                    pathTransform.translate(0, -vbbox.y);
                    lyrHeight = vbbox.height;
                    break;
            }
        }

        if (mirror != ENUMS.MIRROR_NONE) {
            switch (mirror) {
                case ENUMS.MIRROR_H:
                    pathTransform.scale(-1, 1).translate(lyrWidth, 0);
                    doReverse = true;
                    break;
                case ENUMS.MIRROR_V:
                    pathTransform.scale(1, -1).translate(0, lyrHeight);
                    doReverse = true;
                    break;
                case ENUMS.MIRROR_H_AND_V:
                    pathTransform.scale(-1, -1).translate(lyrWidth, lyrHeight);
                    break;
            }
        }

        // Scale

        switch (p_settings.Get(IDS.TR_LYR_SCALE_MODE)) {
            case ENUMS.SCALE_MANUAL:
                scale = p_settings.Get(IDS.TR_LYR_SCALE_FACTOR);
                lyrWidth *= scale;
                lyrHeight *= scale;
                break;
            case ENUMS.SCALE_NORMALIZE:
                break;
        }

        let
            ctxAnchor = p_settings.Get(IDS.TR_ANCHOR),
            selfAnchor = p_settings.Get(IDS.TR_LYR_SELF_ANCHOR);
        // Adjust offsetX based on context & input
        // context
        switch (ctxAnchor) {
            case ENUMS.ANCHOR_TOP_LEFT:
            case ENUMS.ANCHOR_LEFT:
            case ENUMS.ANCHOR_BOTTOM_LEFT:
                break;
            case ENUMS.ANCHOR_TOP:
            case ENUMS.ANCHOR_CENTER:
            case ENUMS.ANCHOR_BOTTOM:
                offsetX += ctxW * 0.5;
                break;
            case ENUMS.ANCHOR_TOP_RIGHT:
            case ENUMS.ANCHOR_RIGHT:
            case ENUMS.ANCHOR_BOTTOM_RIGHT:
                offsetX += ctxW;
                break;
        }
        // path
        switch (selfAnchor) {
            case ENUMS.ANCHOR_TOP_LEFT:
            case ENUMS.ANCHOR_LEFT:
            case ENUMS.ANCHOR_BOTTOM_LEFT:
                break;
            case ENUMS.ANCHOR_TOP:
            case ENUMS.ANCHOR_CENTER:
            case ENUMS.ANCHOR_BOTTOM:
                offsetX -= lyrWidth * 0.5;
                break;
            case ENUMS.ANCHOR_TOP_RIGHT:
            case ENUMS.ANCHOR_RIGHT:
            case ENUMS.ANCHOR_BOTTOM_RIGHT:
                offsetX -= lyrWidth;
                break;
        }

        // Adjust offsetY based on context & input
        // context
        switch (ctxAnchor) {
            case ENUMS.ANCHOR_TOP_LEFT:
            case ENUMS.ANCHOR_TOP:
            case ENUMS.ANCHOR_TOP_RIGHT:
                break;
            case ENUMS.ANCHOR_LEFT:
            case ENUMS.ANCHOR_CENTER:
            case ENUMS.ANCHOR_RIGHT:
                offsetY += ctxH * 0.5;
                break;
            case ENUMS.ANCHOR_BOTTOM_LEFT:
            case ENUMS.ANCHOR_BOTTOM:
            case ENUMS.ANCHOR_BOTTOM_RIGHT:
                offsetY += ctxH;
                break;
        }
        // path
        switch (selfAnchor) {
            case ENUMS.ANCHOR_TOP_LEFT:
            case ENUMS.ANCHOR_TOP:
            case ENUMS.ANCHOR_TOP_RIGHT:
                break;
            case ENUMS.ANCHOR_LEFT:
            case ENUMS.ANCHOR_CENTER:
            case ENUMS.ANCHOR_RIGHT:
                offsetY -= lyrHeight * 0.5;
                break;
            case ENUMS.ANCHOR_BOTTOM_LEFT:
            case ENUMS.ANCHOR_BOTTOM:
            case ENUMS.ANCHOR_BOTTOM_RIGHT:
                offsetY -= lyrHeight;
                break;
        }

        let yUserOffset = p_settings.Get(IDS.TR_Y_OFFSET);
        offsetY += yUserOffset;
        offsetX += p_settings.Get(IDS.TR_X_OFFSET);

        path = pathTransform
            .scale(scale)
            .translate(offsetX, offsetY)
            .toString();

        if (doReverse) { path = svgpathreverse.reverse(path); }

        return {
            height: Math.max(lyrHeight, 0),
            width: Math.max(lyrWidth, 0),
            fit: { width: lyrWidth, height: lyrHeight, x: offsetX, y: offsetY, yoff: yUserOffset },
            path: path,
            bbox: this.GetBBox(path)
        };

    }

    static _Rot(p_tr, p_rot, p_anchor, p_w, p_h) {

        if (p_rot == 0) { return p_tr; }

        let ox = 0, oy = 0;

        switch (p_anchor) {
            case ENUMS.ANCHOR_TOP:
            case ENUMS.ANCHOR_CENTER:
            case ENUMS.ANCHOR_BOTTOM:
                ox = p_w * 0.5;
                break;
            case ENUMS.ANCHOR_TOP_RIGHT:
            case ENUMS.ANCHOR_RIGHT:
            case ENUMS.ANCHOR_BOTTOM_RIGHT:
                ox = p_w;
                break;
        }

        switch (p_anchor) {
            case ENUMS.ANCHOR_BOTTOM_LEFT:
            case ENUMS.ANCHOR_BOTTOM:
            case ENUMS.ANCHOR_BOTTOM_RIGHT:
                oy = p_h;
                break;
            case ENUMS.ANCHOR_LEFT:
            case ENUMS.ANCHOR_CENTER:
            case ENUMS.ANCHOR_RIGHT:
                oy = p_h * 0.5;
                break;
        }

        p_tr.rotate(p_rot, ox, oy);

        return p_tr;
    }

    static _SkewX(p_tr, p_amnt) {
        if (p_amnt == 0) { return p_tr; }
        p_tr.skewX(p_amnt);
        return p_tr;
    }

    static _SkewY(p_tr, p_amnt) {
        if (p_amnt == 0) { return p_tr; }
        p_tr.skewY(p_amnt);
        return p_tr;
    }

    /**
     * 
     * @param {*} p_pathData 
     * @param {*} p_scale 
     * @deprecated isn't used anywhere, not maintained, you sure you need that?
     */
    static ScalePathData(p_pathData, p_scale) {
        p_pathData.width *= p_scale;
        p_pathData.height *= p_scale;
        p_pathData.path = svgpath(p_pathData.path).scale(p_scale, p_scale).toString();
        let bbox = p_pathData.bbox;
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

    static SVGFromGlyphVariant(p_variant, p_includeMark = true, p_markCol = `FF00FF`) {

        let
            inlined = `mkf-em="${p_variant.family.Get(IDS.EM_UNITS)}" `,
            markedPath = ``,
            tr = p_variant._transformSettings._values,
            vr = p_variant._values,
            p = p_variant.Get(IDS.PATH_DATA);

        for (let p in tr) {
            let v = tr[p];
            if (v == null || nkm.u.isNumber(v) || nkm.u.isString(v)) { inlined += `mkf-${p}="${v}" `; }
        }

        for (let p in vr) {
            let v = vr[p];
            if (v == null || nkm.u.isNumber(v) || nkm.u.isString(v)) { inlined += `mkf-${p}="${v}" `; }
        }

        if (p_includeMark) {
            markedPath = `<path style="stroke:#${p_markCol};fill:none" d="M 0 0 L ${p.width} 0 L ${p.width} ${p.height} L 0 ${p.height} z"></path>`;
        }

        return `<!-- Generator : MkFont --><svg viewBox="0 0 ${p.width} ${p.height}" ${inlined}><path d="${p.path}"></path>${markedPath}</svg>`;

    }

    static TryGetMKFValues(p_svgString, p_variant) {

        let result = {
            transforms: {},
            hasTransforms: false,
            variantValues: {},
            hasVariantValues: false,
        };

        try {

            let svg = domparser.parseFromString(p_svgString, `image/svg+xml`).getElementsByTagName(`svg`)[0];
            if (!svg) { return result; }

            let
                em = Number(svg.getAttribute(`mkf-em`)),
                scaleFactor = Number.isNaN(em) ? 1 : p_variant.glyph.family.Get(IDS.EM_UNITS) / em,
                resample = (scaleFactor != 1);

            let
                refTr = p_variant._transformSettings._values,
                refVr = p_variant._values;


            for (let id in refTr) {
                if (this.TryAssignAttribute(id, svg, result.transforms, resample, scaleFactor)) { result.hasTransforms = true; }
            }

            for (let id in refVr) {
                if (id == IDS.PATH_DATA) { continue; }
                if (this.TryAssignAttribute(id, svg, result.variantValues, resample, scaleFactor)) { result.hasVariantValues = true; }
            }

        } catch (e) { console.error(e); }

        return result;

    }

    static TryAssignAttribute(p_id, p_source, p_target, p_resample = false, p_scaleFactor = 0) {

        let nkmId = `mkf-${p_id}`;

        if (!p_source.hasAttribute(nkmId)) { return false; }

        let
            value = p_source.getAttribute(nkmId),
            num = Number(value)

        if (!Number.isNaN(num)) {
            if (p_resample) {
                if (IDS.TR_RESAMPLE_IDS.includes(p_id) ||
                    IDS.GLYPH_RESAMPLE_IDS.includes(p_id)) { value = num * p_scaleFactor; }
                else { value = num; }
            } else { value = num; }
        }
        else {
            if (value == 'null') { value = null; }
            else if (value == 'true') { value = true; }
            else if (value == 'false') { value = false; }
        }

        if (value === undefined) { return false; }

        p_target[p_id] = value;

        return true;

    }

}

globalThis.SVGOPS = module.exports = SVGOperations;
