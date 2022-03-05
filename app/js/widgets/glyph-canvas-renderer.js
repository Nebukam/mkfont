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
    }

    _PostInit() {
        super._PostInit();
    }

    set zoom(p_value) {
        this._zoom = p_value;
        this.Render();
    }

    Set(p_glyphVariant) {

        if (!p_glyphVariant) {
            this.Clear();
            return false;
        }

        let path = p_glyphVariant.Get(IDS.PATH);

        this._infos = p_glyphVariant.subFamily._previewInfos;
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
            ref = Math.min(this.width, this.height),
            scale = (ref / f.ref) * z,
            iscale = 1 / scale;

        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.translate(f * 0.5, 0);

        // Draw glyph
        let col = nkm.style.Get(`--glyph-color`);
        ctx.fillStyle = col;
        ctx.fill(this._path2D);

        // Baseline
        ctx.strokeStyle = nkm.style.Get(`--col-active`);
        ctx.lineWidth = iscale;
        ctx.setLineDash([iscale, iscale]);
        ctx.beginPath();
        ctx.moveTo(0, f.asc);
        ctx.lineTo(this.width * iscale, f.asc);
        ctx.stroke();

        // Baseline
        ctx.strokeStyle = `#fff`;// nkm.style.Get(`--col-error`);
        ctx.lineWidth = iscale;
        //ctx.setLineDash([iscale, iscale]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.width * iscale, 0);
        ctx.moveTo(0, f.em);
        ctx.lineTo(this.width * iscale, f.em);
        ctx.stroke();


    }

    _Cleanup() {
        super._Cleanup();
    }

}

module.exports = GlyphCanvasRenderer;
ui.Register(`mkfont-glyph-canvas-renderer`, GlyphCanvasRenderer);