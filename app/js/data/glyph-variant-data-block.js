'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.utils;
const io = nkm.io;

const SimpleDataEx = require(`./simple-data-ex`);
const IDS = require(`./ids`);
const TransformSettings = require(`./tr-settings-data-block`);

const svgpath = require('svgpath');
const UNICODE = require('../unicode');

const domparser = new DOMParser();
const svgString = `<glyph ${IDS.GLYPH_NAME}="" ${IDS.UNICODE}="" d="" ${IDS.WIDTH}="" ${IDS.HEIGHT}="" ></glyph>`;

const svgGlyphRef = domparser.parseFromString(svgString, `image/svg+xml`).getElementsByTagName(`glyph`)[0];

class GlyphVariantDataBlock extends SimpleDataEx {

    constructor() { super(); }

    _Init() {

        super._Init();

        this._values = {
            [IDS.H_ORIGIN_X]: { value: null },
            [IDS.H_ORIGIN_Y]: { value: null },
            [IDS.WIDTH]: { value: null },
            [IDS.V_ORIGIN_X]: { value: null },
            [IDS.V_ORIGIN_Y]: { value: null },
            [IDS.HEIGHT]: { value: null },
            [IDS.PATH]: { value: '' },
            [IDS.PATH_DATA]: { value: null }
        }

        this._transformSettings = new TransformSettings();
        this._transformSettings.glyphVariantOwner = this;

        this._glyph = null;

    }

    _BuildFontObject() { return svgGlyphRef.cloneNode(true); }

    get resolutionFallbacks() { return [this._transformSettings, this._glyph, this._subFamily]; }

    get transformSettings(){ return this._transformSettings; }

    set glyph(p_value) { this._glyph = p_value; }
    get glyph() { return this._glyph; }

    get subFamily() { return this._subFamily; }
    set subFamily(p_variant) {

        if (this._subFamily == p_variant) { return; }

        this._subFamily = p_variant;

        if (this._subFamily) { this._subFamily.fontObject.appendChild(this._fontObject); }
        else { this._fontObject.remove(); }

    }

    _UpdateFontObject() {

        if (!this._glyph) { return; }

        let glyph = this._fontObject;

        dom.SAtt(glyph, IDS.WIDTH, this._subFamily.Get(IDS.MONOSPACE) ? this._subFamily.Get(IDS.WIDTH) : this.Resolve(IDS.WIDTH), true);
        dom.SAtt(glyph, IDS.HEIGHT, this.Resolve(IDS.HEIGHT), true);
        dom.SAtt(glyph, IDS.GLYPH_NAME, this.Resolve(IDS.GLYPH_NAME));

        let uVal = parseInt(this.Resolve(IDS.UNICODE), 16);
        
        dom.SAtt(glyph, IDS.UNICODE, `${UNICODE.GetUnicodeCharacter(uVal)}`);

        
        // Flip
        let glyphPath = svgpath(this.Get(IDS.PATH))
            .scale(1, -1)
            .translate(0, this._subFamily.Get(IDS.ASCENT))
            .toString();

        glyph.setAttribute(`d`, glyphPath);

    }

    _OnSubFamilyValueUpdated(p_subFamily, p_valueObj) {

    }

    _CleanUp() {
        this.glyph = null;
        super._CleanUp();
    }


}

module.exports = GlyphVariantDataBlock;