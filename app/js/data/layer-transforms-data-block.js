'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.u;
const io = nkm.io;

const SimpleDataEx = require(`./simple-data-ex`);
const IDS = require(`./ids`);
const ENUMS = require(`./enums`);

class LayerTransformsDataBlock extends SimpleDataEx {

    constructor() {
        super();
        this._layer = null;
    }

    _ResetValues(p_values) {

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

    CommitUpdate() {
        super.CommitUpdate();
        if (this._layer) {
            if (this._layer._variant) {
                this._layer._variant._ScheduleTransformationUpdate();
            }
        }
    }

    _CleanUp() {
        this._layer = null;
        super._CleanUp();
    }

}

module.exports = LayerTransformsDataBlock;