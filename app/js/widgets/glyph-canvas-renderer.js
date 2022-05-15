'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const IDS = require(`../data/ids`);

var __patternImg;

const __BASE__ = ui.helpers.Canvas;
class GlyphCanvasRenderer extends __BASE__ {
    constructor() { super(); }

    static __distribute = nkm.com.helpers.OptionsDistribute.Ext()
        .To(`drawGuides`)
        .To(`drawLabels`)
        .To(`drawHorAxis`)
        .To(`drawVerAxis`)
        .To(`drawBBox`)
        .To(`normalize`)
        .To(`centered`);

    _Init() {
        super._Init();

        if (!__patternImg) {
            __patternImg = new Image();
            __patternImg.src = nkm.style.URLImgs(`dot100.png`);
        }

        this._zoom = 1;
        this._glyphPath = new Path2D();
        this._computedPath = null;

        this._contextInfos = null;
        this._drawGuides = false;
        this._drawLabels = false;
        this._centered = true;
        this._drawHorAxis = false;
        this._drawVerAxis = false;
        this._drawBBox = false;
        this._nrm = false;

        this._emptyGlyph = false;

        this.glyphColor = null;

    }

    _PostInit() {
        super._PostInit();
    }

    set options(p_value) { this.constructor.__distribute.Update(this, p_value); }

    get drawGuides() { return this._drawGuides; }
    set drawGuides(p_value) { this._drawGuides = p_value; }

    get drawLabels() { return this._drawLabels; }
    set drawLabels(p_value) { this._drawLabels = p_value; }

    get drawHorAxis() { return this._drawHorAxis; }
    set drawHorAxis(p_value) { this._drawHorAxis = p_value; }

    get drawVerAxis() { return this._drawVerAxis; }
    set drawVerAxis(p_value) { this._drawVerAxis = p_value; }

    get drawBBox() { return this._drawBBox; }
    set drawBBox(p_value) { this._drawBBox = p_value; }

    get centered() { return this._centered; }
    set centered(p_value) { this._centered = p_value; }

    get normalize() { return this._nrm; }
    set normalize(p_value) { this._nrm = p_value; }

    set zoom(p_value) {
        this._zoom = p_value;
        this.Render();
    }

    set contextInfos(p_value) {
        this._contextInfos = p_value;
        if (p_value) { this._glyphWidth = p_value.w; }
        this._delayedRedraw.Schedule();
    }
    set glyphPath(p_value) {
        this._glyphPath = p_value ? new Path2D(p_value) : null;
        this._delayedRedraw.Schedule();
    }
    set glyphWidth(p_value) {
        this._glyphWidth = p_value;
        this._delayedRedraw.Schedule();
    }

    set glyphColor(p_value) { this._glyphColor = p_value; }

    set computedPath(p_value) {
        this._computedPath = p_value;
        this._emptyGlyph = false;
        if (this._computedPath) {
            if (IDS.isEmptyPathContent(this._computedPath.path)) { this._emptyGlyph = true; }
        }
    }

    Set(p_glyphVariant) {

        if (!p_glyphVariant ||
            p_glyphVariant.glyph.isNull) {
            this.Clear();
            this.contextInfos = null;
            this.computedPath = null;
            this._compositePath = false;
            this.glyphPath = null;
            return false;
        }

        this.contextInfos = p_glyphVariant.family._contextInfos;
        this.glyphWidth = p_glyphVariant.Resolve(IDS.EXPORTED_WIDTH);
        this.glyphPath = p_glyphVariant.Get(IDS.PATH);
        this.computedPath = p_glyphVariant._computedPath;
        this._compositePath = !p_glyphVariant._layers.isEmpty;

        this.Draw();

        return this._glyphPath ? true : false;

    }

    set transformSettings(p_value) {
        this._trSettings = p_value;
        this._delayedRedraw.Schedule();
    }

    set layer(p_value) {
        this._layer = p_value;
        this._delayedRedraw.Schedule();
    }

    _InternalDraw(ctx, p_delta = 0) {

        this.Clear();

        if (!this._contextInfos || !this._glyphPath) { return; }

        let
            z = this._zoom,
            f = this._contextInfos,
            w = this.width,
            h = this.height,
            ref = Math.min(w, h),
            os = 0.5, ros = (1 - os) * 0.5,
            scale = (ref / (this._nrm ? Math.max(f.ref, this._glyphWidth) : f.ref)) * z * os,
            iscale = 1 / scale;

        ctx.setTransform(scale, 0, 0, scale, 0, 0);

        if (this._centered) {
            ctx.translate(((w * iscale) * 0.5) - this._glyphWidth * 0.5 + 0.5, (h * iscale) * ros + 0.5 - (f.offy));
        } else {
            ctx.translate((w * iscale) * ros, (h * iscale) * ros - (f.offy));
        }

        // Draw glyph
        let col = this._glyphColor || nkm.style.Get(`--glyph-color`),
            glyphCol = col;

        ctx.fillStyle = col;

        if (this._emptyGlyph) {

            if (this._compositePath) {

                if (this._computedPath && this._drawBBox) {
                    let cw = this._glyphWidth;
                    ctx.lineWidth = iscale;
                    ctx.strokeStyle = `rgba(${nkm.style.Get(`--col-warning-dark-rgb`)},0.8)`;
                    ctx.beginPath();
                    ctx.rect(0, 0, cw, f.em);
                    ctx.stroke();

                    ctx.strokeStyle = `rgba(${nkm.style.Get(`--col-warning-dark-rgb`)},0.25)`;
                    ctx.beginPath();
                    ctx.moveTo(0, 0); ctx.lineTo(cw, f.em);
                    ctx.moveTo(cw, 0); ctx.lineTo(0, f.em);
                    ctx.stroke();

                }

                ctx.fill(this._glyphPath);

            } else {
                if (this._computedPath) {
                    let cw = this._glyphWidth;
                    ctx.lineWidth = iscale;
                    ctx.strokeStyle = `rgba(${nkm.style.Get(`--col-warning-dark-rgb`)},0.8)`;
                    ctx.beginPath();
                    ctx.rect(0, 0, cw, f.em);
                    ctx.stroke();

                    ctx.strokeStyle = `rgba(${nkm.style.Get(`--col-warning-dark-rgb`)},0.25)`;
                    ctx.beginPath();
                    ctx.moveTo(0, 0); ctx.lineTo(cw, f.em);
                    ctx.moveTo(cw, 0); ctx.lineTo(0, f.em);
                    ctx.stroke();

                }
            }

        } else {
            ctx.fill(this._glyphPath);
        }

        if (this._drawBBox && this._computedPath) {
            if (this._computedPath.fit) {

                let fit = this._computedPath.fit, off = 10 * iscale, offw = off * 2;
                ctx.strokeStyle = nkm.style.Get(`--col-infos`);
                ctx.lineWidth = iscale;

                ctx.beginPath();
                ctx.moveTo(0, fit.y + fit.height * 0.5); ctx.lineTo(fit.x, fit.y + fit.height * 0.5);
                ctx.moveTo(fit.x + fit.width, fit.y + fit.height * 0.5); ctx.lineTo(this._glyphWidth, fit.y + fit.height * 0.5);
                ctx.moveTo(fit.x + fit.width * 0.5, fit.y + fit.height); ctx.lineTo(fit.x + fit.width * 0.5, fit.y + fit.height - fit.yoff);
                ctx.stroke();

                ctx.beginPath();
                ctx.rect(fit.x - off, fit.y - off, offw, offw);
                ctx.rect(fit.x + fit.width - off, fit.y - off, offw, offw);
                ctx.rect(fit.x - off, fit.y + fit.height - off, offw, offw);
                ctx.rect(fit.x + fit.width - off, fit.y + fit.height - off, offw, offw);
                ctx.save();
                ctx.clip();
                ctx.beginPath();
                ctx.rect(fit.x, fit.y, fit.width, fit.height);
                ctx.stroke();
                ctx.restore();
                ctx.strokeStyle = `rgb(${nkm.style.Get(`--col-infos-rgb`)},0.25)`;
                ctx.beginPath();
                ctx.rect(fit.x, fit.y, fit.width, fit.height);
                ctx.moveTo(fit.x, fit.y); ctx.lineTo(fit.x + fit.width, fit.y + fit.height);
                ctx.moveTo(fit.x + fit.width, fit.y); ctx.lineTo(fit.x, fit.y + fit.height);
                ctx.stroke();

            }
        }

        if (this._drawGuides) {

            let
                maxx = w * iscale,
                minx = -maxx,
                maxy = h * iscale,
                miny = -maxy,
                txoff = -20 * iscale,
                tyoff = -3 * iscale,
                gw = this._glyphWidth;

            // Draw mask

            ctx.beginPath();
            //ctx.moveTo(minx, 0);
            //ctx.lineTo(maxx, 0);
            ctx.moveTo(minx, miny);
            ctx.lineTo(maxx, miny);
            ctx.lineTo(maxx, maxy);
            ctx.lineTo(minx, maxy);
            ctx.lineTo(minx, miny);
            ctx.lineTo(0, 0);
            ctx.lineTo(0, f.em);
            ctx.lineTo(gw, f.em);
            ctx.lineTo(gw, 0);
            ctx.lineTo(0, 0);
            ctx.closePath();
            /*
            let pattern = ctx.createPattern(__patternImg, 'repeat');
            //ctx.fillStyle = `rgba(0,0,0,0.1)`;
            //ctx.fill();
            ctx.fillStyle = pattern;
            ctx.globalAlpha = 0.25;
            ctx.fill();
            ctx.globalAlpha = 1;
            */

            ctx.save();
            ctx.clip();
            let col = nkm.style.Get(`--col-warning-rgb`);
            ctx.fillStyle = `rgba(${col}, 0.5)`;
            ctx.fill(this._glyphPath);
            ctx.restore();

            if (this._drawLabels) {
                ctx.fillStyle = `rgba(127,127,127,0.65)`;
                ctx.font = `${10 * iscale}px 'Regular'`;
                ctx.textAlign = 'right';
            }

            let bsl = f.bsl,
                ascy = bsl - f.asc;

            if (this._drawLabels) { ctx.fillText('Asc', txoff, ascy + tyoff); }

            // Baseline
            ctx.strokeStyle = nkm.style.Get(`--col-${(f.bsl > f.em) ? 'warning' : 'active'}`);
            ctx.lineWidth = iscale;
            ctx.setLineDash([iscale * 2, iscale * 2]);
            ctx.beginPath();

            ctx.lineCap = 'round';
            ctx.moveTo(minx, bsl);
            ctx.lineTo(maxx, bsl);
            ctx.stroke();

            if (this._drawLabels) { ctx.fillText('Base', txoff, bsl + tyoff); }

            ctx.setLineDash([]);

            // Glyph values

            ctx.strokeStyle = `rgba(127,127,127,0.5)`;// ${nkm.style.Get(`--col-processing-rgb`)}

            ctx.lineWidth = iscale;

            // Asc + Desc
            ctx.beginPath();
            ctx.moveTo(minx, ascy);
            ctx.lineTo(maxx, ascy);
            ctx.moveTo(minx, bsl - f.dsc);
            ctx.lineTo(maxx, bsl - f.dsc);
            ctx.stroke();

            if (this._drawLabels) { ctx.fillText('Desc', txoff, bsl - f.dsc + tyoff); }

            // Vertical bounds 
            ctx.beginPath();
            ctx.moveTo(0, miny);
            ctx.lineTo(0, maxy);
            ctx.moveTo(gw, miny);
            ctx.lineTo(gw, maxy);
            ctx.stroke();

            if (this._drawLabels) { ctx.fillText('x-adv', (gw + 10 * iscale) - txoff, tyoff); }

            // family values            
            ctx.strokeStyle = `rgba(255,255,255,0.1)`;

            // family width
            ctx.setLineDash([iscale * 2, iscale * 4]);
            ctx.beginPath();
            ctx.moveTo(f.w, miny);
            ctx.lineTo(f.w, maxy);
            ctx.stroke();
            ctx.setLineDash([]);

            if (this._drawLabels) {
                ctx.fillText('X', txoff, bsl - f.xh + tyoff);
                ctx.fillText('CAP', txoff, bsl - f.ch + tyoff);
            }

            ctx.strokeStyle = `rgba(127,127,127,0.1)`;

            ctx.lineWidth = iscale;
            ctx.beginPath();
            ctx.moveTo(minx, bsl - f.xh);
            ctx.lineTo(maxx, bsl - f.xh);
            ctx.moveTo(minx, bsl - f.ch);
            ctx.lineTo(maxx, bsl - f.ch);
            ctx.stroke();

            ctx.strokeStyle = `rgba(255,255,255,0.1)`;

            // EM square
            ctx.lineWidth = iscale;
            ctx.beginPath();
            ctx.moveTo(minx, 0);
            ctx.lineTo(maxx, 0);
            ctx.moveTo(minx, f.em);
            ctx.lineTo(maxx, f.em);
            ctx.stroke();

            ctx.strokeStyle = `rgba(255,255,255,0.5)`;
            ctx.lineWidth = iscale * 3;
            ctx.beginPath();
            ctx.moveTo(-10 * iscale, 0);
            ctx.lineTo(0, 0);
            ctx.moveTo(-10 * iscale, f.em);
            ctx.lineTo(0, f.em);
            ctx.stroke();

            if (this._drawLabels) { ctx.fillText('EM', txoff, f.em + tyoff); }

            // family values            
            ctx.strokeStyle = `rgba(${nkm.style.Get(`--col-warning-rgb`)},0.5)`;

            if (this._drawHorAxis) {
                ctx.beginPath();
                //ctx.moveTo(minx, 0);
                //ctx.lineTo(maxx, 0);
                ctx.moveTo(minx, f.h * 0.5);
                ctx.lineTo(maxx, f.h * 0.5);
                ctx.stroke();
            }

            if (this._drawVerAxis) {
                ctx.beginPath();
                //ctx.moveTo(minx, 0);
                //ctx.lineTo(maxx, 0);
                ctx.moveTo(f.w * 0.5, miny);
                ctx.lineTo(f.w * 0.5, maxy);
                ctx.stroke();
            }

            if (f.mono) {
                ctx.strokeStyle = `rgba(${nkm.style.Get(`--col-infos-rgb`)},0.5)`;
                ctx.lineWidth = iscale * 2;
                ctx.beginPath();
                ctx.moveTo(0, f.em);
                ctx.lineTo(f.w, f.em);
                ctx.stroke();
            }

        }

        if (this._layer) {

            let path = this._layer.Get(IDS.PATH);
            if (path && path.path) {


                let
                    ppa = new Path2D(path.path),
                    fit = path.fit;

                ctx.shadowColor = 'black';
                ctx.shadowBlur = 25;
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fill(ppa);
                ctx.shadowColor = null;
                ctx.shadowBlur = null;
                ctx.globalCompositeOperation = 'source-over';

                ctx.fillStyle = `rgb(${nkm.style.Get(`--col-error-rgb`)},0.1)`;
                ctx.fill(ppa);

                ctx.fillStyle = 'white';
                ctx.save();
                ctx.clip(this._glyphPath);
                ctx.fill(ppa);
                ctx.restore();


                ctx.beginPath();
                ctx.rect(fit.x, fit.y, fit.width, fit.height);
                ctx.moveTo(fit.x, fit.y); ctx.lineTo(fit.x + fit.width, fit.y + fit.height);
                ctx.moveTo(fit.x + fit.width, fit.y); ctx.lineTo(fit.x, fit.y + fit.height);
                ctx.strokeStyle = `rgb(${nkm.style.Get(`--col-warning-rgb`)},0.25)`;
                ctx.stroke();

            }

        } else if (this._trSettings) {

        }

    }

    _CleanUp() {
        this._contextInfos = null;
        super._CleanUp();
    }

}

module.exports = GlyphCanvasRenderer;
ui.Register(`mkf-glyph-canvas-renderer`, GlyphCanvasRenderer);