'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.u;
const io = nkm.io;

const SimpleDataEx = require(`./simple-data-ex`);
const IDS = require(`./ids`);
const ENUMS = require(`./enums`);

class TransformSettingsDataBlock extends SimpleDataEx {

    constructor() { super(); }

    _Init() {

        super._Init();
        this._glyphVariantOwner = null;

    }

    _ResetValues(p_values) {

        p_values[IDS.TR_BOUNDS_MODE] = { value: ENUMS.BOUNDS_MIXED };
        p_values[IDS.TR_SCALE_MODE] = { value: ENUMS.SCALE_ASCENDER };
        p_values[IDS.TR_SCALE_FACTOR] = { value: 1 };
        p_values[IDS.TR_NRM_FACTOR] = { value: 0 };
        p_values[IDS.TR_VER_ALIGN] = { value: ENUMS.VALIGN_BASELINE };
        p_values[IDS.TR_VER_ALIGN_ANCHOR] = { value: ENUMS.VANCHOR_BOTTOM };
        p_values[IDS.TR_HOR_ALIGN] = { value: ENUMS.HALIGN_XMIN };
        p_values[IDS.TR_HOR_ALIGN_ANCHOR] = { value: ENUMS.HANCHOR_LEFT };
        p_values[IDS.TR_WIDTH_SHIFT] = { value: 0 };
        p_values[IDS.TR_WIDTH_PUSH] = { value: 0 };
        p_values[IDS.TR_AUTO_WIDTH] = { value: true };

    }

    set glyphVariantOwner(p_value) { this._glyphVariantOwner = p_value; }

    get resolutionFallbacks() {
        if (this._glyphVariantOwner) { return [this._glyphVariantOwner._family._transformSettings]; }
        else { return []; }
    }

    ResolveVariant(p_id, p_fallback) {
        if (this._glyphVariantOwner) {
            let val = this._glyphVariantOwner.Resolve(p_id);
            if (val == null || val == undefined) { return p_fallback; }
            return val;
        }
        return p_fallback;
    }

    CommitUpdate() {
        super.CommitUpdate();
        if (this._glyphVariantOwner) { this.UpdateTransform(); }
    }

    UpdateTransform() {

        let pathData = this._glyphVariantOwner.Get(IDS.PATH_DATA);

        if (!pathData || !this._glyphVariantOwner._family) { return; }

        let
            rw = this._glyphVariantOwner.Get(IDS.WIDTH),
            path = SVGOPS.FitPath(this,
                this._glyphVariantOwner._family._contextInfos,
                pathData
            ),
            w = 0,
            oob = (path.bbox.left < -32000 ||
                path.bbox.top < -32000 ||
                path.bbox.bottom > 32000 ||
                path.bbox.right > 32000);



        if (this.Get(IDS.TR_AUTO_WIDTH)) {
            w = path.width;
            if (this.Get(IDS.TR_SCALE_MODE) != ENUMS.SCALE_NORMALIZE && rw != null) { rw = w; }
        } else {
            w = this._glyphVariantOwner.Resolve(IDS.WIDTH);
        }

        this._glyphVariantOwner._computedPath = path;

        this._glyphVariantOwner.BatchSet({
            [IDS.WIDTH]: rw,
            [IDS.EXPORTED_WIDTH]: w,
            [IDS.PATH]: path.path,
            [IDS.OUT_OF_BOUNDS]: oob,
            [IDS.EMPTY]: pathData.path === `M 0 0 L 0 0 z`,
        });

    }

    _CleanUp() {
        super._CleanUp();
    }


}

module.exports = TransformSettingsDataBlock;