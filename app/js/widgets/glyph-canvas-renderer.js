const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const IDS = require(`../data/ids`);

var __patternImg;

class GlyphCanvasRenderer extends ui.helpers.Canvas {
    constructor() { super(); }

    _Init() {
        super._Init();

        if (!__patternImg) {
            __patternImg = new Image();
            __patternImg.src = nkm.style.URLImgs(`dot100.png`);
        }

        this._zoom = 1;
        this._glyphPath = new Path2D();

        this._contextInfos = null;
        this._drawGuides = false;
        this._drawLabels = false;
        this._centered = true;
        this._drawHorAxis = false;
        this._drawVerAxis = false;

        this._distribute = new nkm.com.helpers.OptionsDistribute();
        this._distribute
            .To(`drawGuides`)
            .To(`drawLabels`)
            .To(`drawHorAxis`)
            .To(`drawVerAxis`)
            .To(`centered`);

    }

    _PostInit() {
        super._PostInit();
    }

    set options(p_value){ this._distribute.Update(this, p_value); }

    get drawGuides() { return this._drawGuides; }
    set drawGuides(p_value) { this._drawGuides = p_value; }

    get drawLabels() { return this._drawLabels; }
    set drawLabels(p_value) { this._drawLabels = p_value; }

    get drawHorAxis() { return this._drawHorAxis; }
    set drawHorAxis(p_value) { this._drawHorAxis = p_value; }

    get drawVerAxis() { return this._drawVerAxis; }
    set drawVerAxis(p_value) { this._drawVerAxis = p_value; }

    get centered() { return this._centered; }
    set centered(p_value) { this._centered = p_value; }

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


    Set(p_glyphVariant) {

        if (!p_glyphVariant ||
            p_glyphVariant.glyph.isNull) {
            this.Clear();
            this.contextInfos = null;
            this.glyphPath = null;
            return false;
        }

        this.contextInfos = p_glyphVariant.subFamily._contextInfos;
        this.glyphWidth = p_glyphVariant.Resolve(IDS.WIDTH);
        this.glyphPath = p_glyphVariant.Get(IDS.PATH);

        this.Draw();

        return this._glyphPath ? true : false;

    }

    _InternalDraw(ctx, p_delta) {

        this.Clear();

        if (!this._contextInfos || !this._glyphPath) { return; }

        let
            z = this._zoom,
            f = this._contextInfos,
            w = this.width,
            h = this.height,
            ref = Math.min(w, h),
            os = 0.5, ros = (1 - os) * 0.5,
            scale = (ref / f.ref) * z * os,
            iscale = 1 / scale;

        ctx.setTransform(scale, 0, 0, scale, 0, 0);

        if (this._centered) {
            ctx.translate(((w * iscale) * 0.5) - this._glyphWidth * 0.5 + 0.5, (h * iscale) * ros + 0.5);
        } else {
            ctx.translate((w * iscale) * ros, (h * iscale) * ros);
        }


        // Draw glyph
        let col = nkm.style.Get(`--glyph-color`);
        ctx.fillStyle = col;
        ctx.fill(this._glyphPath);

        if (this._drawGuides) {

            let
                maxx = w * iscale,
                minx = -maxx,
                maxy = h * iscale,
                miny = -maxy,
                txoff = -10 * iscale,
                tyoff = -5 * iscale,
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
            let pattern = ctx.createPattern(__patternImg, 'repeat');
            //ctx.fillStyle = `rgba(0,0,0,0.1)`;
            //ctx.fill();
            ctx.fillStyle = pattern;
            ctx.globalAlpha = 0.25;
            ctx.fill();
            ctx.globalAlpha = 1;

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


            if (this._drawLabels) { ctx.fillText('Asc', txoff, tyoff); }

            // Baseline
            ctx.strokeStyle = nkm.style.Get(`--col-active`);
            ctx.lineWidth = iscale;
            ctx.setLineDash([iscale * 2, iscale * 2]);
            ctx.beginPath();

            ctx.lineCap = 'round';
            ctx.moveTo(minx, f.asc);
            ctx.lineTo(maxx, f.asc);
            ctx.stroke();

            if (this._drawLabels) { ctx.fillText('Base', txoff, f.asc + tyoff); }

            ctx.setLineDash([]);

            // Glyph values

            ctx.strokeStyle = `rgba(127,127,127,0.5)`;// ${nkm.style.Get(`--col-processing-rgb`)}

            // Desc
            ctx.lineWidth = iscale;
            //ctx.setLineDash([iscale, iscale]);
            ctx.beginPath();
            ctx.moveTo(minx, 0);
            ctx.lineTo(maxx, 0);
            ctx.moveTo(minx, f.asc - f.dsc);
            ctx.lineTo(maxx, f.asc - f.dsc);
            ctx.stroke();

            if (this._drawLabels) { ctx.fillText('Desc', txoff, f.asc - f.dsc + tyoff); }

            // vLine
            ctx.beginPath();
            ctx.moveTo(0, miny);
            ctx.lineTo(0, maxy);
            ctx.moveTo(gw, miny);
            ctx.lineTo(gw, maxy);
            ctx.stroke();

            // family values            
            ctx.strokeStyle = `rgba(255,255,255,0.1)`;

            // subfm width
            ctx.beginPath();
            ctx.moveTo(0, miny);
            ctx.lineTo(0, maxy);
            ctx.moveTo(f.w, miny);
            ctx.lineTo(f.w, maxy);
            ctx.stroke();

            // EM
            ctx.lineWidth = iscale;
            //ctx.setLineDash([iscale, iscale]);
            ctx.beginPath();
            //ctx.moveTo(minx, 0);
            //ctx.lineTo(maxx, 0);
            ctx.moveTo(minx, f.em);
            ctx.lineTo(maxx, f.em);
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

        }

    }

    _Cleanup() {
        this._contextInfos = null;
        super._Cleanup();
    }

}

module.exports = GlyphCanvasRenderer;
ui.Register(`mkfont-glyph-canvas-renderer`, GlyphCanvasRenderer);