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
        this._variant = null;

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

    set variant(p_value) { this._variant = p_value; }

    get resolutionFallbacks() {
        if (this._variant) { return [this._variant._family._transformSettings]; }
        else { return []; }
    }

    ResolveVariant(p_id, p_fallback) {
        if (this._variant) {
            let val = this._variant.Resolve(p_id);
            if (val == null || val == undefined) { return p_fallback; }
            return val;
        }
        return p_fallback;
    }

    CommitUpdate() {
        super.CommitUpdate();
        if (this._variant) { this.UpdateTransform(); }
    }

    UpdateTransform() {

        let pathData = this._variant.Get(IDS.PATH_DATA);

        if (!pathData || !this._variant._family) { return; }

        let
            flattenLayers = this._variant.Get(IDS.FLATTEN_LAYERS),
            autoW = this.Get(IDS.TR_AUTO_WIDTH),
            rw = this._variant.Resolve(IDS.WIDTH),
            path = SVGOPS.FitPath(this, this._variant.family._contextInfos, pathData),
            w = 0,
            h = this._variant.Resolve(IDS.HEIGHT),
            controlVariant = null;

        if (this._variant.controlLayer &&
            this._variant.controlLayer.importedVariant &&
            !this._variant.controlLayer._isCircular) {
            controlVariant = this._variant.controlLayer.importedVariant;
        }

        if (controlVariant) {
            w = controlVariant.Get(IDS.EXPORTED_WIDTH);
            h = controlVariant.Resolve(IDS.HEIGHT);
        } else {
            if (flattenLayers) {
                w = rw;
            } else {
                if (autoW) {
                    w = path.width;
                } else {
                    w = rw;
                }
            }

        }

        this._variant._computedPath = path;

        let
            bbmin = Math.min(path.bbox.left, path.bbox.right, path.bbox.top, path.bbox.bottom),
            bbmax = Math.max(path.bbox.left, path.bbox.right, path.bbox.top, path.bbox.bottom);


        if (!this._variant.layers.isEmpty) {
            let
                prevLayer = null,
                prevLayerData = null;

            this._variant.layers.ForEach(item => {
                let ref = item.importedVariant;
                if (ref && !item._isCircular && item.Get(IDS.DO_EXPORT)) {

                    let
                        layerCP = item.Get(IDS.PATH),
                        layerPath = ref.Get(IDS.PATH);

                    if (item.Get(IDS.INVERTED)) { layerPath = svgpr.reverse(layerPath); }

                    if (item.Get(IDS.LYR_USE_PREV_LAYER) && prevLayerData) {
                        layerCP = SVGOPS.FitLayerPath(
                            item, prevLayerData, prevLayerData.width, prevLayerData.HEIGHT,
                            layerPath, ref.Get(IDS.EXPORTED_WIDTH), ref.Resolve(IDS.HEIGHT));
                    } else {
                        layerCP = SVGOPS.FitLayerPath(
                            item, path, w, h,
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

        let pathConcat = this._variant._ConcatPaths(path.path);
        if (flattenLayers) {
            let flatStats = SVGOPS.FlatSVGStats(pathConcat, this._variant._computedPath, this._variant, w, h);
            let flatFit = SVGOPS.FitPath(this, this._variant.family._contextInfos, flatStats);
            pathConcat = flatFit.path;
            w = autoW ? flatFit.width : rw;
            this._variant._computedPath = flatFit;
        }

        let oob = (bbmin < -24000 || bbmax < -24000 || bbmin > 24000 || bbmax > 24000);

        this._variant.BatchSet({
            //[IDS.WIDTH]: rw,
            [IDS.EXPORTED_WIDTH]: w,
            [IDS.PATH]: pathConcat, //path.pathReversed || path.path,
            [IDS.OUT_OF_BOUNDS]: oob,
            [IDS.EMPTY]: IDS.isEmptyPathContent(pathConcat),
        });

    }

}

module.exports = TransformSettingsDataBlock;