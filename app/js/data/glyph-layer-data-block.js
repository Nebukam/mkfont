'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.u;
const io = nkm.io;

const SimpleDataEx = require(`./simple-data-ex`);
const IDS = require(`./ids`);
const LayerTransforms = require(`./layer-transforms-data-block`);

const svgpath = require('svgpath');
const ContentUpdater = require(`../content-updater`);
const UNICODE = require('../unicode');

const domparser = new DOMParser();
const svgString = `<glyph ${IDS.GLYPH_NAME}="" ${IDS.UNICODE}="" d="" ${IDS.WIDTH}="" ${IDS.HEIGHT}="" ></glyph>`;

const svgGlyphRef = domparser.parseFromString(svgString, `image/svg+xml`).getElementsByTagName(`glyph`)[0];

class GlyphLayerDataBlock extends SimpleDataEx {

    constructor() { super(); }

    _Init() {

        super._Init();

        this._transformSettings = new LayerTransforms();
        this._transformSettings._layer = this;

        this._variant = null;
        this._index = 0;
        this.expanded = false;

        this._glyphInfos = null;

    }

    _ResetValues(p_values) {
        p_values[IDS.PATH] = { value: '' };
        p_values[IDS.INVERTED] = { value: false };
        p_values[IDS.CHARACTER_NAME] = { value: null };
        p_values[IDS.EXPORT_GLYPH] = { value: true };
    }

    get glyphInfos() {
        if (!this._glyphInfos) { this._RetrieveGlyphInfos(); }
        return this._glyphInfos;
    }
    set glyphInfos(p_value) { this._glyphInfos = p_value; }

    get index() { return this._index; }
    set index(p_value) {
        if (this._index == p_value) { return; }
        this._index = p_value;
        if (this._variant) { this._variant._ScheduleTransformationUpdate(); }
    }

    get transformSettings() { return this._transformSettings; }

    get importedVariant() { return this._importedVariant; }
    set importedVariant(p_value) {

        if (this._importedVariant == p_value) { return; }
        if (this._importedVariant) {
            this._importedVariant.layerUsers.Remove(this);
        }

        this._importedVariant = p_value;

        if (this._importedVariant) {
            this._importedVariant.layerUsers.Add(this);
        }

        if (this._variant) { this._variant._ScheduleTransformationUpdate(); }

    }

    _RetrieveGlyphInfos() {
        this._glyphInfos = UNICODE.TryGetInfosFromString(this.Get(IDS.CHARACTER_NAME));
        this._RetrieveImportedVariant();
    }

    _RetrieveImportedVariant() {

        if (this._glyphInfos == null) {
            this.importedVariant = null;
            return;
        }

        let glyph = this._variant.family.GetGlyph(this._glyphInfos.u);
        if (glyph.isNull) { this.importedVariant = null; }
        else {
            // Check for circular dependency
            let isCircular = false;

            if(isCircular){
                this.Set(IDS.CHARACTER_NAME, ``);
                return;
            }
            this.importedVariant = glyph.activeVariant;
        }

    }

    CommitValueUpdate(p_id, p_valueObj, p_oldValue, p_silent = false) {
        if (p_id == IDS.CHARACTER_NAME) { this._RetrieveGlyphInfos(); }
        super.CommitValueUpdate(p_id, p_valueObj, p_oldValue, p_silent);
        let infos = IDS.GetInfos(p_id);
        if (!infos) { return; }
        if (infos.recompute && this._variant) { this._variant._ScheduleTransformationUpdate(); }
    }

    _OnReset(p_individualSet, p_silent) {
        this._transformSettings.Reset(p_individualSet, p_silent);
        super._OnReset();
    }

    _CleanUp() {
        this.importedVariant = null;
        this._variant = null;
        this._index = 0;
        this.expanded = false;
        this._glyphInfos = null;
        super._CleanUp();
    }


}

module.exports = GlyphLayerDataBlock;