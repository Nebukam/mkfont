'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.u;
const io = nkm.io;

const SimpleDataEx = require(`./simple-data-ex`);
const IDS = require(`./ids`);
const TransformSettings = require(`./settings-transforms-data-block`);

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

        this._transformSettings = new TransformSettings();
        this._transformSettings.glyphVariantOwner = this;

        this._glyph = null;
        this._computedPath = null;
        this._index = 0;

    }

    get index() { return this._index; }
    set index(p_value) {
        if (this._index == p_value) { return; }
        this._index = p_value;
        this._scheduledObjectUpdate.Schedule();
    }

    _ResetValues(p_values) {
        //p_values[IDS.H_ORIGIN_X] = { value: null };
        //p_values[IDS.H_ORIGIN_Y] = { value: null };
        p_values[IDS.WIDTH] = { value: null, nullable: true };
        p_values[IDS.EXPORTED_WIDTH] = { value: 0 };
        //p_values[IDS.V_ORIGIN_X] = { value: null };
        //p_values[IDS.V_ORIGIN_Y] = { value: null };
        p_values[IDS.HEIGHT] = { value: null, nullable: true }; //
        p_values[IDS.PATH] = { value: '' };
        p_values[IDS.PATH_DATA] = { value: null };
        p_values[IDS.OUT_OF_BOUNDS] = { value: false };
        p_values[IDS.EMPTY] = { value: false };
        p_values[IDS.EXPORT_GLYPH] = { value: true };
    }

    _BuildFontObject() { return svgGlyphRef.cloneNode(true); }

    get resolutionFallbacks() { return [this._transformSettings, this._glyph, this._glyph.family]; }

    get transformSettings() { return this._transformSettings; }

    set glyph(p_value) { this._glyph = p_value; }
    get glyph() { return this._glyph; }

    get family() { return this._family; }
    set family(p_value) {
        if (this._family == p_value) { return; }
        this._family = p_value;
        if (this._family) { this._family.fontObject.appendChild(this._fontObject); }
        else { this._fontObject.remove(); }
    }

    _UpdateFontObject() {

        if (!this._glyph) { return; }
        if (!this._glyph.family) { this._fontObject.remove(); return; }
        if (this._glyph == this._glyph.family._refGlyph) { return; }

        let
            svgGlyph = this._fontObject,
            uInfos = this._glyph.unicodeInfos,
            uCode = this.Resolve(IDS.UNICODE),
            width = this._family.Get(IDS.MONOSPACE) ? this._family.Get(IDS.WIDTH) : this.Resolve(IDS.EXPORTED_WIDTH),
            height = this.Resolve(IDS.HEIGHT);

        svgGlyph.setAttribute(SVGOPS.ATT_H_ADVANCE, width);
        svgGlyph.setAttribute(SVGOPS.ATT_V_ADVANCE, height);
        svgGlyph.setAttribute(SVGOPS.ATT_GLYPH_NAME, `${uCode}@${this._index}`);
        svgGlyph.setAttribute(SVGOPS.ATT_UNICODE, `${uInfos ? uInfos.char : ''}`);

        // Flip
        let glyphPath = svgpath(this.Get(IDS.PATH))
            .scale(1, -1)
            .translate(0, this._family.Get(IDS.BASELINE))
            .toString();

        svgGlyph.setAttribute(SVGOPS.ATT_PATH, glyphPath);

        if (this.Get(IDS.OUT_OF_BOUNDS) || !this.Resolve(IDS.EXPORT_GLYPH) || this._glyph.isNull) {
            this._fontObject.remove();
        } else if (this._family) {
            this._family.fontObject.appendChild(this._fontObject);
        }

    }

    CommitValueUpdate(p_id, p_valueObj, p_oldValue, p_silent = false) {
        super.CommitValueUpdate(p_id, p_valueObj, p_oldValue, p_silent);
        let infos = IDS.GetInfos(p_id);
        if (!infos) { return; }
        if (infos.recompute && this._family) { this._ScheduleTransformationUpdate(); }
    }

    _ScheduleTransformationUpdate() {
        ContentUpdater.Push(this, this._ApplyTransformUpdate);
    }

    _ApplyTransformUpdate() {
        this._transformSettings.UpdateTransform();
    }

    _OnReset(p_individualSet, p_silent) {
        this._transformSettings.Reset(p_individualSet, p_silent);
        super._OnReset();
    }

    _CleanUp() {
        this.glyph = null;
        super._CleanUp();
    }


}

module.exports = GlyphVariantDataBlock;