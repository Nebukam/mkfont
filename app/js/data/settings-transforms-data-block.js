'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.u;
const io = nkm.io;

const svgpr = require('svg-path-reverse');

const SimpleDataEx = require(`./simple-data-ex`);
const IDS = require(`./ids`);
const ENUMS = require(`./enums`);

class TransformSettingsDataBlock extends SimpleDataEx {

    constructor() { super(); }

    _Init() {

        super._Init();
        this._glyphVariantOwner = null;
        this._waitingForUpdate = false;

    }

    _ResetValues(p_values) {

        p_values[IDS.TR_BOUNDS_MODE] = { value: ENUMS.BOUNDS_MIXED };
        p_values[IDS.TR_SCALE_MODE] = { value: ENUMS.SCALE_ASCENDER };
        p_values[IDS.TR_SCALE_FACTOR] = { value: 1 };
        p_values[IDS.TR_NRM_FACTOR] = { value: 0 };
        p_values[IDS.TR_VER_ALIGN] = { value: ENUMS.VALIGN_BASELINE };
        p_values[IDS.TR_HOR_ALIGN] = { value: ENUMS.HALIGN_XMIN };
        p_values[IDS.TR_ANCHOR] = { value: ENUMS.ANCHOR_BOTTOM_LEFT };
        p_values[IDS.TR_WIDTH_SHIFT] = { value: 0, nullable: true, propagate: true };
        p_values[IDS.TR_WIDTH_PUSH] = { value: 0, nullable: true, propagate: true };
        p_values[IDS.TR_AUTO_WIDTH] = { value: true };
        p_values[IDS.TR_Y_OFFSET] = { value: 0, nullable: true, propagate: true };
        p_values[IDS.TR_MIRROR] = { value: ENUMS.MIRROR_NONE };
        p_values[IDS.TR_SKEW_ROT_ORDER] = { value: ENUMS.SKR_ORDER_R_X_Y, nullable: true, propagate: true };
        p_values[IDS.TR_ROTATION] = { value: 0, nullable: true, propagate: true };
        p_values[IDS.TR_ROTATION_ANCHOR] = { value: ENUMS.ANCHOR_CENTER, nullable: true, propagate: true };
        p_values[IDS.TR_SKEW_X] = { value: 0, nullable: true, propagate: true };
        p_values[IDS.TR_SKEW_Y] = { value: 0, nullable: true, propagate: true };

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

        this._waitingForUpdate = false;

        let pathData = this._glyphVariantOwner.Get(IDS.PATH_DATA);

        if (!pathData || !this._glyphVariantOwner._family) { return; }

        let
            rw = this._glyphVariantOwner.Get(IDS.WIDTH),
            path = SVGOPS.FitPath(this, this._glyphVariantOwner.family._contextInfos, pathData),
            w = 0;


        if (this.Get(IDS.TR_AUTO_WIDTH)) {
            w = path.width;
        } else {
            w = this._glyphVariantOwner.Resolve(IDS.WIDTH);
        }

        this._glyphVariantOwner._computedPath = path;

        let
            bbmin = Math.min(path.bbox.left, path.bbox.right, path.bbox.top, path.bbox.bottom),
            bbmax = Math.max(path.bbox.left, path.bbox.right, path.bbox.top, path.bbox.bottom);


        if (!this._glyphVariantOwner.layers.isEmpty) {
            let
                prevLayer = null,
                prevLayerData = null;
            this._glyphVariantOwner.layers.ForEach(item => {
                let ref = item.importedVariant;
                if (ref && !item._isCircular && item.Get(IDS.EXPORT_GLYPH)) {

                    let
                        layerCP = item.Get(IDS.PATH),
                        layerPath = ref.Get(IDS.PATH);

                    if (item.Get(IDS.INVERTED)) { layerPath = svgpr.reverse(layerPath); }

                    if (item.Get(IDS.USE_PREV_LAYER) && prevLayerData) {
                        layerCP = SVGOPS.FitLayerPath(
                            item, prevLayerData, prevLayerData.width, prevLayerData.HEIGHT,
                            layerPath, ref.Get(IDS.EXPORTED_WIDTH), ref.Resolve(IDS.HEIGHT));
                    } else {
                        layerCP = SVGOPS.FitLayerPath(
                            item, path, w, this._glyphVariantOwner.Resolve(IDS.HEIGHT),
                            layerPath, ref.Get(IDS.EXPORTED_WIDTH), ref.Resolve(IDS.HEIGHT));
                    }

                    item._values[IDS.PATH].value = layerCP;
                    item._CleanLayer();

                    let bb = layerCP.bbox;
                    prevLayerData = layerCP;

                    bbmin = Math.min(bbmin, bb.left, bb.right, bb.top, bb.bottom);
                    bbmax = Math.max(bbmax, bb.left, bb.right, bb.top, bb.bottom);

                } else {
                    //prevLayerData = null; //So 'prev layer' is actually "closest valid layer"
                    item._values[IDS.PATH].value = null;
                }

                prevLayer = item;
            });
        }

        let
            pathConcat = this._glyphVariantOwner._ConcatPaths(path.path),
            oob = (bbmin < -24000 || bbmax < -24000 || bbmin > 24000 || bbmax > 24000);

        this._glyphVariantOwner.BatchSet({
            //[IDS.WIDTH]: rw,
            [IDS.EXPORTED_WIDTH]: w,
            [IDS.PATH]: pathConcat, //path.pathReversed || path.path,
            [IDS.OUT_OF_BOUNDS]: oob,
            [IDS.EMPTY]: pathConcat === IDS.EMPTY_PATH_CONTENT,
        });

    }

    _CleanUp() {
        this._waitingForUpdate = false;
        super._CleanUp();
    }


}

module.exports = TransformSettingsDataBlock;