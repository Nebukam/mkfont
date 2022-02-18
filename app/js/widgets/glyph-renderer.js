const nkm = require(`@nkmjs/core`);
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
            },
            '.line': {
                'stroke': 'white',
                'stroke-width': `1`
            },
            '.baseline': {
                'stroke': 'var(--col-cta)',
                'stroke-width': `1`
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

    Set(p_glyph) {

        if (!p_glyph) {
            this._glyphPath.setAttribute(`d`, ``);
            this._svgGrid.setAttribute(`viewBox`, `0 0 0 0`);
            return;
        }

        let
            subFamily = p_glyph.family.defaultSubFamily,
            o = subFamily.Get(IDS.DISPLAY_OFFSET),
            s = subFamily.Get(IDS.DISPLAY_SIZE),
            w = p_glyph._defaultGlyph.Get(IDS.H_ADV_X, 0, true),
            ox = o;

        this._Line(this._baseline, `y`, subFamily.Get(IDS.ASCENT));
        this._Line(this._descentline, `y`, subFamily.Get(IDS.ASCENT) - subFamily.Get(IDS.DESCENT));
        this._Line(this._endline, `x`, w);

        this._svgGrid.setAttribute(`viewBox`, `${ox} ${o} ${s} ${s}`);

        this._glyphPath.setAttribute(`d`, p_glyph._defaultGlyph.Get(IDS.PATH));

    }

    _Line(p_el, p_coord, p_value) {
        p_el.setAttribute(`${p_coord}1`, p_value);
        p_el.setAttribute(`${p_coord}2`, p_value);
    }

    _Cleanup() {
        super._Cleanup();
    }

}

module.exports = GlyphRenderer;
ui.Register(`mkfont-glyph-renderer`, GlyphRenderer);