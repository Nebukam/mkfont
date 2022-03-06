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
        this._path2D = new Path2D();
        this._infos = null;
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

    Set(p_glyphVariant) {

        if (!p_glyphVariant) {
            this.Clear();
            this._infos = null;
            this._path2D = null;
            return false;
        }

        let path = p_glyphVariant.Get(IDS.PATH);

        this._infos = p_glyphVariant.subFamily._previewInfos;
        this._glyphWidth = p_glyphVariant.Resolve(IDS.WIDTH);
        this._path2D = new Path2D(path);

        this.Draw();

        return path ? true : false;

    }

    _InternalDraw(ctx, p_delta) {

        this.Clear();

        if (!this._infos) { return; }

        let
            z = this._zoom,
            f = this._infos,
            w = this.width,
            h = this.height,
            ref = Math.min(w, h),
            scale = (ref / f.ref) * z,
            iscale = 1 / scale;

        ctx.setTransform(scale, 0, 0, scale, 0, 0);

        if (this._centered) {
            ctx.translate(((this.width * iscale) * 0.5) - this._glyphWidth * 0.5, 0);
        } else {
            //ctx.translate(f * 0.5, 0);
        }

        // Draw glyph
        let col = nkm.style.Get(`--glyph-color`);
        ctx.fillStyle = col;
        ctx.fill(this._path2D);

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
        super._Cleanup();
    }

}

module.exports = GlyphCanvasRenderer;
ui.Register(`mkfont-glyph-canvas-renderer`, GlyphCanvasRenderer);