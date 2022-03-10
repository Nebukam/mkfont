/*const nkm = require(`@nkmjs/core`);*/
const ui = nkm.ui;
const uilib = nkm.uilib;

const IDS = require(`../data/ids`);

const domparser = new DOMParser();
const __x1 = -100000;
const __x2 = 200000;
const __x3 = 0;
const __x4 = 1000;
const __ly1 = 500;
const __ly2 = 0;
const __ly3 = 800;
const svgString =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">` +
    `<line x1="${__x1}" y1="${__ly1}" x2="${__x2}" y2="${__ly1}" class="line baseline" vector-effect="non-scaling-stroke"/>` +
    `<line x1="${__x1}" y1="${__ly2}" x2="${__x2}" y2="${__ly2}" class="line ascent" vector-effect="non-scaling-stroke"/>` +
    `<line x1="${__x1}" y1="${__ly3}" x2="${__x2}" y2="${__ly3}" class="line descent" vector-effect="non-scaling-stroke"/>` +
    `<line x1="${__x3}" y1="${__x1}" x2="${__x3}" y2="${__x2}" class="line begin" vector-effect="non-scaling-stroke"/>` +
    `<line x1="${__x4}" y1="${__x1}" x2="${__x4}" y2="${__x2}" class="line end" vector-effect="non-scaling-stroke"/>` +
    `<path style="fill:var(--glyph-color); stroke:none;" d=""></path>` +
    `</svg>`;

const gridRef = domparser.parseFromString(svgString, `image/svg+xml`).getElementsByTagName(`svg`)[0];

class GlyphRenderer extends ui.DisplayObject {
    constructor() { super(); }

    static __usePaintCallback = true;

    _Init() {
        super._Init();
        this._zoom = 1;
    }

    _PostInit() {
        super._PostInit();
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
            },
            'svg': {
                'height': '100%',
                'aspect-ratio': 'var(--preview-ratio)',
                'overflow':'visible'
            },
            '.line': {
                'stroke': 'white',
                'stroke-width': `1`
            },
            '.baseline': {
                'stroke': 'var(--col-cta)',
                'stroke-width': `1`,
                'stroke-dasharray': '1,2'
            },
            '.ascent': {
                'stroke': 'rgba(127,127,127,0.5)',
                'stroke-dasharray': '1,2'
            },
            '.descent': {
                'stroke': 'rgba(127,127,127,0.5)',
                'stroke-dasharray': '1,2'
            },
            '.begin, .end': {
                'stroke': 'rgba(127,127,127,0.25)',
            },
        }, super._Style());
    }

    set zoom(p_value){
        this._zoom = p_value;
        this.Render();
    }

    _Render() {
        super._Render();

        this._svgGrid = gridRef.cloneNode(true);
        ui.dom.Attach(this._svgGrid, this._host);

        let lines = this._svgGrid.getElementsByTagName(`line`);
        this._baseline = lines[0];
        this._ascentline = lines[1];
        this._descentline = lines[2];
        this._beginline = lines[3];
        this._endline = lines[4];

        let paths = this._svgGrid.getElementsByTagName(`path`);
        this._glyphPath = paths[0];

    }

    Set(p_glyphVariant) {

        if (!p_glyphVariant) {
            this._glyphPath.setAttribute(`d`, ``);
            this._svgGrid.setAttribute(`viewBox`, `0 0 0 0`);
            return false;
        }

        let
            subFamily = p_glyphVariant.subFamily,
            o = subFamily.Resolve(IDS.DISPLAY_OFFSET),
            s = subFamily.Resolve(IDS.DISPLAY_SIZE),
            w = p_glyphVariant.Resolve(IDS.WIDTH, 0, true),
            ox = o,//-((s-w) * 0.5),
            asc = subFamily.Resolve(IDS.ASCENT),
            desc = subFamily.Resolve(IDS.ASCENT) - subFamily.Resolve(IDS.DESCENT);

        this._infos = {
            o:o,
            s:s,
            w:w,
            ox:ox,
            asc:asc,
            desc:desc
        };

        this._Line(this._baseline, `y`, asc);
        this._Line(this._descentline, `y`, desc);
        this._Line(this._endline, `x`, w);

        //this._Top(o);
        //this._Bottom(s);

        this.Render();

        let path = p_glyphVariant.Get(IDS.PATH);

        this._glyphPath.setAttribute(`d`, path);

        // see for in-renderer editing http://phrogz.net/svg/rotate-to-point-at-cursor.svg

        return path ? true : false;

    }

    Render(){

        if(!this._infos){ return; }

        let zoom = this._zoom;
        let i = this._infos,
            o = i.o * zoom,
            s = i.s * zoom,
            ox = i.ox * zoom;

        this._svgGrid.setAttribute(`viewBox`, `${ox} ${o} ${s} ${s}`);
    }

    _Line(p_el, p_coord, p_value) {
        p_el.setAttribute(`${p_coord}1`, p_value);
        p_el.setAttribute(`${p_coord}2`, p_value);
    }

    _Top(p_value) {
        this._beginline.setAttribute(`y1`, p_value);
        this._endline.setAttribute(`y1`, p_value);
    }

    _Bottom(p_value) {
        this._beginline.setAttribute(`y2`, p_value);
        this._endline.setAttribute(`y2`, p_value);
    }

    _Cleanup() {
        super._Cleanup();
    }

}

module.exports = GlyphRenderer;
ui.Register(`mkfont-glyph-renderer`, GlyphRenderer);