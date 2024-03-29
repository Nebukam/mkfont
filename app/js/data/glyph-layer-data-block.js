'use strict';

const nkm = require(`@nkmjs/core`);

const FontObjectData = require(`./font-object-data`);
const IDS = require(`./ids`);

const UNICODE = require('../unicode');
const SIGNAL = require('../signal');

const ENUMS = require(`./enums`);

class GlyphLayerDataBlock extends FontObjectData {
    constructor() { super(); }

    static __VALUES = {

        [IDS.PATH]: { value: '' },
        [IDS.INVERTED]: { value: false },
        [IDS.LYR_IS_CONTROL_LAYER]: { value: false },
        [IDS.CIRCULAR_REFERENCE]: { value: false },
        [IDS.LYR_CHARACTER_NAME]: { value: `` },
        [IDS.LYR_CUSTOM_ID]: { value: null },
        [IDS.DO_EXPORT]: { value: true },
        [IDS.LYR_INDEX]: { value: 0 },

        // Transform settings
        [IDS.LYR_USE_PREV_LAYER]: { value: false },
        [IDS.TR_LYR_BOUNDS_MODE]: { value: ENUMS.BOUNDS_OUTSIDE },
        [IDS.TR_BOUNDS_MODE]: { value: ENUMS.BOUNDS_OUTSIDE },
        [IDS.TR_LYR_SCALE_MODE]: { value: ENUMS.SCALE_MANUAL },
        [IDS.TR_LYR_SCALE_FACTOR]: { value: 1 },
        [IDS.TR_NRM_FACTOR]: { value: 0 },
        [IDS.TR_ANCHOR]: { value: ENUMS.ANCHOR_CENTER },
        [IDS.TR_LYR_SELF_ANCHOR]: { value: ENUMS.ANCHOR_CENTER },
        [IDS.TR_X_OFFSET]: { value: 0 },
        [IDS.TR_Y_OFFSET]: { value: 0 },
        [IDS.TR_MIRROR]: { value: ENUMS.MIRROR_NONE },

        [IDS.TR_SKEW_ROT_ORDER]: { value: ENUMS.SKR_ORDER_R_X_Y },
        [IDS.TR_ROTATION]: { value: 0 },
        [IDS.TR_ROTATION_ANCHOR]: { value: ENUMS.ANCHOR_CENTER },
        [IDS.TR_SKEW_X]: { value: 0 },
        [IDS.TR_SKEW_Y]: { value: 0 },

    };

    _Init() {

        super._Init();

        this._variant = null;
        this._index = 0;
        this.expanded = false;

        this._glyphInfos = null;
        this._isCircular = false;
        this._useCount = -1;

        this._dirtyLayer = true;
        this._computedPath = null;

    }

    get glyphInfos() { return this._glyphInfos; }
    set glyphInfos(p_value) { this._glyphInfos = p_value; }

    get index() { return this._index; }
    set index(p_value) {
        if (this._index == p_value) { return; }
        this._index = p_value;
        this._values[IDS.LYR_INDEX] = p_value;
        if (this._variant) { this._DirtyLayer(); }
    }

    get importedVariant() { return this._importedVariant; }
    set importedVariant(p_value) {

        if (this._importedVariant == p_value) { return; }
        if (this._importedVariant) {
            this._importedVariant.layerUsers.Remove(this);
            this._importedVariant
                .Unwatch(SIGNAL.LAYERS_UPDATED, this._OnImportedVariantLayersUpdated, this)
                .Unwatch(nkm.com.SIGNAL.UPDATED, this._DirtyLayer, this);
        }

        this._importedVariant = p_value;

        if (this._importedVariant) {
            this._importedVariant.layerUsers.Add(this);
            this._importedVariant
                .Watch(SIGNAL.LAYERS_UPDATED, this._OnImportedVariantLayersUpdated, this)
                .Watch(nkm.com.SIGNAL.UPDATED, this._DirtyLayer, this);
        } else {
            this._isCircular = false;
            this.Set(IDS.PATH, null); //Clear path
        }

        //Some update do require to recompute the whole chain (value updates coming from imported layers)
        //while local transforms only require the variant to recompute its transform

        this._DirtyLayer();

    }

    _OnImportedVariantLayersUpdated() {
        if (this._isCircular) { this._RetrieveImportedVariant(); }
    }

    _RetrieveGlyphInfos() {
        this._glyphInfos = UNICODE.TryGetInfosFromString(this.Get(IDS.LYR_CHARACTER_NAME));
        this._RetrieveImportedVariant();
    }

    _RetrieveImportedVariant() {

        if (this._glyphInfos == null || !this._variant || !this._variant.family) {
            this.importedVariant = null;
            return;
        }

        let glyph = this._variant.family.GetGlyph(this._glyphInfos.u);
        if (glyph.isNull) {

            this.importedVariant = null;
            this._values[IDS.CIRCULAR_REFERENCE] = false;

        } else {

            let candidate = glyph.activeVariant;

            this._isCircular = this._variant.family.HasCircularDep(this._variant, candidate);
            this.importedVariant = candidate;
            this.Set(IDS.CIRCULAR_REFERENCE, this._isCircular);

        }

    }

    CommitValueUpdate(p_id, p_newValue, p_oldValue, p_silent = false) {
        if (p_id == IDS.LYR_CHARACTER_NAME) { this._RetrieveGlyphInfos(); }
        if (p_id == IDS.LYR_IS_CONTROL_LAYER) {
            if (p_newValue) { this._variant.controlLayer = this; }
            else if (this._variant.controlLayer == this) { this._variant.controlLayer = null; }
        }
        super.CommitValueUpdate(p_id, p_newValue, p_oldValue, p_silent);
    }

    _DirtyLayer() {
        if (this._isCircular) { return; }
        this._dirtyLayer = true;
        this._variant._PushUpdate(true);
    }

    CommitUpdate() {
        this._DirtyLayer();
        super.CommitUpdate();
    }

    _CleanLayer() { this._dirtyLayer = false; }

    _CleanUp() {
        this.surveyedList = null;
        this._computedPath = null;
        this._useCount = -1;
        this.importedVariant = null;
        this._variant = null;
        this._index = 0;
        this.expanded = false;
        this._glyphInfos = null;
        this._isCircular = false;
        super._CleanUp();
        this._dirtyLayer = true;
    }


}

module.exports = nkm.data.Register(GlyphLayerDataBlock);