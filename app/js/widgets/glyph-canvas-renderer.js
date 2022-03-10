/*const nkm = require(`@nkmjs/core`);*/
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
        this._previewInfos = null;
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

    set previewInfos(p_value){ 
        this._previewInfos = p_value; 
        if(p_value){ this._glyphWidth = p_value.w; }
        this._delayedRedraw.Schedule();
    }
    set glyphPath(p_value){ 
        this._glyphPath = p_value ? new Path2D(p_value) : null; 
        this._delayedRedraw.Schedule();
    }
    set glyphWidth(p_value){ 
        this._glyphWidth = p_value; 
        this._delayedRedraw.Schedule();
    }

    Set(p_glyphVariant) {

        if (!p_glyphVariant) {
            this.Clear();
            this.previewInfos = null;
            this.glyphPath = null;
            return false;
        }

        this.previewInfos = p_glyphVariant.subFamily._previewInfos;
        this.glyphWidth = p_glyphVariant.Resolve(IDS.WIDTH);
        this.glyphPath = p_glyphVariant.Get(IDS.PATH);

        this.Draw();

        return this._glyphPath ? true : false;

    }

    _InternalDraw(ctx, p_delta) {

        this.Clear();

        if (!this._previewInfos || !this._glyphPath) { return; }

        let
            z = this._zoom,
            f = this._previewInfos,
            w = this.width,
            h = this.height,
            ref = Math.min(w, h),
            os = 0.5, ros = (1 - os)*0.5,
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

            // Baseline
            ctx.strokeStyle = nkm.style.Get(`--col-active`);
            ctx.lineWidth = iscale;
            ctx.setLineDash([iscale, iscale]);
            ctx.beginPath();
            ctx.moveTo(0, f.asc);
            ctx.lineTo(w * iscale, f.asc);
            ctx.stroke();

            // Baseline
            ctx.strokeStyle = `#fff`;// nkm.style.Get(`--col-error`);
            ctx.lineWidth = iscale;
            //ctx.setLineDash([iscale, iscale]);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(w * iscale, 0);
            ctx.moveTo(0, f.em);
            ctx.lineTo(w * iscale, f.em);
            ctx.stroke();

        }

    }

    _Cleanup() {
        this._previewInfos = null;
        super._Cleanup();
    }

}

module.exports = GlyphCanvasRenderer;
ui.Register(`mkfont-glyph-canvas-renderer`, GlyphCanvasRenderer);