'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.u;
const io = nkm.io;

const SimpleDataEx = require(`./simple-data-ex`);
const IDS = require(`./ids`);

const UNICODE = require('../unicode');
const SIGNAL = require('../signal');

const ENUMS = require(`./enums`);

class GlyphLayerDataBlock extends SimpleDataEx {

    constructor() { super(); }

    _Init() {

        super._Init();

        this._variant = null;
        this._index = 0;
        this.expanded = true;

        this._glyphInfos = null;
        this._isCircular = false;

    }

    _ResetValues(p_values) {

        // Base bs
        p_values[IDS.PATH] = { value: '' };
        p_values[IDS.INVERTED] = { value: false };
        p_values[IDS.CIRCULAR_REFERENCE] = { value: false };
        p_values[IDS.CHARACTER_NAME] = { value: null };
        p_values[IDS.EXPORT_GLYPH] = { value: true };

        // Transform settings
        p_values[IDS.TR_LYR_BOUNDS_MODE] = { value: ENUMS.LYR_BOUNDS_OUTSIDE };
        p_values[IDS.TR_BOUNDS_MODE] = { value: ENUMS.BOUNDS_OUTSIDE };
        p_values[IDS.TR_LYR_SCALE_MODE] = { value: ENUMS.SCALE_NONE };
        p_values[IDS.TR_LYR_SCALE_FACTOR] = { value: 1 };
        p_values[IDS.TR_NRM_FACTOR] = { value: 0 };
        p_values[IDS.TR_LYR_VER_ALIGN] = { value: ENUMS.VANCHOR_CENTER };
        p_values[IDS.TR_VER_ALIGN_ANCHOR] = { value: ENUMS.VANCHOR_CENTER };
        p_values[IDS.TR_LYR_HOR_ALIGN] = { value: ENUMS.HANCHOR_CENTER };
        p_values[IDS.TR_HOR_ALIGN_ANCHOR] = { value: ENUMS.HANCHOR_CENTER };
        p_values[IDS.TR_X_OFFSET] = { value: 0 };
        p_values[IDS.TR_Y_OFFSET] = { value: 0 };
        p_values[IDS.TR_MIRROR] = { value: ENUMS.MIRROR_NONE };

    }

    get glyphInfos() { return this._glyphInfos; }
    set glyphInfos(p_value) { this._glyphInfos = p_value; }

    get index() { return this._index; }
    set index(p_value) {
        if (this._index == p_value) { return; }
        this._index = p_value;
        if (this._variant) { this._variant._ScheduleTransformationUpdate(); }
    }

    get importedVariant() { return this._importedVariant; }
    set importedVariant(p_value) {

        if (this._importedVariant == p_value) { return; }
        if (this._importedVariant) {
            this._importedVariant.layerUsers.Remove(this);
            this._importedVariant.Unwatch(SIGNAL.LAYERS_UPDATED, this._OnImportedVariantLayersUpdated, this);
        }

        this._importedVariant = p_value;

        if (this._importedVariant) {
            this._importedVariant.layerUsers.Add(this);
            this._importedVariant.Watch(SIGNAL.LAYERS_UPDATED, this._OnImportedVariantLayersUpdated, this);
        } else {
            this._isCircular = false;
            this.Set(IDS.PATH, null); //Clear path
        }

        this._variant._ScheduleTransformationUpdate();

    }

    _OnImportedVariantLayersUpdated() {
        if (this._isCircular) { this._RetrieveImportedVariant(); }
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
        if (glyph.isNull) {

            this.importedVariant = null;
            this._values[IDS.CIRCULAR_REFERENCE].value = false;

        } else {

            let candidate = glyph.activeVariant;

            this._isCircular = this._variant.family.HasCircularDep(this._variant, candidate);
            this.importedVariant = candidate;
            this.Set(IDS.CIRCULAR_REFERENCE, this._isCircular);

        }

    }

    CommitValueUpdate(p_id, p_valueObj, p_oldValue, p_silent = false) {
        if (p_id == IDS.CHARACTER_NAME) { this._RetrieveGlyphInfos(); }
        super.CommitValueUpdate(p_id, p_valueObj, p_oldValue, p_silent);
        let infos = IDS.GetInfos(p_id);
        if (!infos) { return; }
        if (infos.recompute && this._variant) { this._variant._ScheduleTransformationUpdate(); }
    }

    _CleanUp() {
        this.importedVariant = null;
        this._variant = null;
        this._index = 0;
        this.expanded = true;
        this._glyphInfos = null;
        this._isCircular = false;
        super._CleanUp();
    }


}

module.exports = GlyphLayerDataBlock;