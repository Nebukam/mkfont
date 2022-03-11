const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const IDS = require(`../data/ids`);

class GlyphCanvasRenderer extends ui.helpers.Canvas {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._alwaysFit = true;
        this._zoom = 1;
        this._glyphPath = new Path2D();
        this._contextInfos = null;
        this._drawGuides = false;
        this._centered = true;
    }

    _PostInit() {
        super._PostInit();
    }

    get drawGuides() { return this._drawGuides; }
    set drawGuides(p_value) { this._drawGuides = p_value; }

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

        if (!p_glyphVariant) {
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
            ctx.translate(((w * iscale) * 0.5) - this._glyphWidth * 0.5, (h * iscale) * ros);
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
                miny = -maxy;

                ctx.lineCap = 'round';

            // Baseline
            ctx.strokeStyle = nkm.style.Get(`--col-active`);
            ctx.lineWidth = iscale;
            ctx.setLineDash([iscale, iscale*3]);
            ctx.beginPath();
            ctx.moveTo(minx, f.asc);
            ctx.lineTo(maxx, f.asc);
            ctx.stroke();

            ctx.setLineDash([]);

            // Desc
            ctx.strokeStyle = `rgba(255,255,255,0.1)`;// nkm.style.Get(`--col-error`);
            ctx.lineWidth = iscale;
            //ctx.setLineDash([iscale, iscale]);
            ctx.beginPath();
            ctx.moveTo(minx, 0);
            ctx.lineTo(maxx, 0);
            ctx.moveTo(minx, f.asc - f.dsc);
            ctx.lineTo(maxx, f.asc - f.dsc);
            ctx.stroke();

            // vLine
            ctx.beginPath();
            ctx.moveTo(0, miny);
            ctx.lineTo(0, maxy);
            ctx.moveTo(this._glyphWidth, miny);
            ctx.lineTo(this._glyphWidth, maxy);
            ctx.stroke();


            // EM
            ctx.strokeStyle = `rgba(255,0,0,0.25)`;// nkm.style.Get(`--col-error`);
            ctx.lineWidth = iscale;
            //ctx.setLineDash([iscale, iscale]);
            ctx.beginPath();
            //ctx.moveTo(minx, 0);
            //ctx.lineTo(maxx, 0);
            ctx.moveTo(minx, f.em);
            ctx.lineTo(maxx, f.em);
            ctx.stroke();

        }

    }

    _Cleanup() {
        this._contextInfos = null;
        super._Cleanup();
    }

}

module.exports = GlyphCanvasRenderer;
ui.Register(`mkfont-glyph-canvas-renderer`, GlyphCanvasRenderer);