'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.utils;
const io = nkm.io;

const SimpleDataEx = require(`./simple-data-ex`);
const IDS = require(`./ids`);
const TransformSettings = require(`./tr-settings-data-block`);

const svgpath = require('svgpath');
const ContentUpdater = require(`../content-updater`);
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
            [IDS.WIDTH]: { value: null, override: true },
            [IDS.V_ORIGIN_X]: { value: null },
            [IDS.V_ORIGIN_Y]: { value: null },
            [IDS.HEIGHT]: { value: null, override: false },
            [IDS.PATH]: { value: '' },
            [IDS.PATH_DATA]: { value: null },
            [IDS.OUT_OF_BOUNDS]: { value: false }
        }

        this._transformSettings = new TransformSettings();
        this._transformSettings.glyphVariantOwner = this;

        this._glyph = null;

    }

    _BuildFontObject() { return svgGlyphRef.cloneNode(true); }

    get resolutionFallbacks() { return [this._transformSettings, this._glyph, this._subFamily]; }

    get transformSettings() { return this._transformSettings; }

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

        let uVal = parseInt(this.Resolve(IDS.UNICODE), 16);

        //this._transformSettings.UpdateTransform();

        dom.SAtt(glyph, IDS.WIDTH, this._subFamily.Get(IDS.MONOSPACE) ? this._subFamily.Get(IDS.WIDTH) : this.Resolve(IDS.WIDTH), true);
        dom.SAtt(glyph, IDS.HEIGHT, this.Resolve(IDS.HEIGHT), true);
        //dom.SAtt(glyph, IDS.GLYPH_NAME, this.Resolve(IDS.GLYPH_NAME));
        dom.SAtt(glyph, IDS.GLYPH_NAME, `${`${uVal}`.padStart(4, '0')}`);

        dom.SAtt(glyph, IDS.UNICODE, `${UNICODE.GetUnicodeCharacter(uVal)}`);

        // Flip
        let glyphPath = svgpath(this.Get(IDS.PATH))
            .scale(1, -1)
            .translate(0, this._subFamily.Get(IDS.ASCENT))
            .toString();

        glyph.setAttribute(`d`, glyphPath);

        if (this.Get(IDS.OUT_OF_BOUNDS)) {
            this._fontObject.remove();
        } else if (this._subFamily) {
            this._subFamily.fontObject.appendChild(this._fontObject)
        }

    }

    CommitValueUpdate(p_id, p_valueObj, p_oldValue, p_silent = false) {
        super.CommitValueUpdate(p_id, p_valueObj, p_oldValue, p_silent);
        let infos = IDS.GetInfos(p_id);
        if (!infos) { return; }
        if (infos.recompute && this._subFamily) {
            this._ScheduleTransformationUpdate();
        }
    }

    _OnSubFamilyValueUpdated(p_subFamily, p_id, p_valueObj, p_oldValue) {
        // TODO : Room for optim here, no need to propagate udpate of EVERY property
        this._ScheduleTransformationUpdate();
    }

    _ScheduleTransformationUpdate() {
        ContentUpdater.Push(this, this._ApplyTransformUpdate);
    }

    _ApplyTransformUpdate() {
        this._transformSettings.UpdateTransform();
    }

    _CleanUp() {
        this.glyph = null;
        super._CleanUp();
    }


}

module.exports = GlyphVariantDataBlock;