'use strict';

const svgpr = require('svg-path-reverse');

const FontObjectData = require(`./font-object-data`);
const IDS = require(`./ids`);
const ENUMS = require(`./enums`);

class TransformSettingsDataBlock extends FontObjectData {
    constructor() { super(); }

    static __VALUES = {

        [IDS.TR_BOUNDS_MODE]: { value: ENUMS.BOUNDS_MIXED_VER },
        [IDS.TR_SCALE_MODE]: { value: ENUMS.SCALE_ASCENDER },
        [IDS.TR_SCALE_FACTOR]: { value: 1 },
        [IDS.TR_NRM_FACTOR]: { value: 0 },
        [IDS.TR_VER_ALIGN]: { value: ENUMS.VALIGN_BASELINE },
        [IDS.TR_HOR_ALIGN]: { value: ENUMS.HALIGN_XMIN },
        [IDS.TR_ANCHOR]: { value: ENUMS.ANCHOR_BOTTOM_LEFT },
        [IDS.TR_WIDTH_SHIFT]: { value: 0, nullable: true, propagate: true },
        [IDS.TR_WIDTH_PUSH]: { value: 0, nullable: true, propagate: true },
        [IDS.TR_AUTO_WIDTH]: { value: true },
        [IDS.TR_Y_OFFSET]: { value: 0, nullable: true, propagate: true },
        [IDS.TR_MIRROR]: { value: ENUMS.MIRROR_NONE },
        [IDS.TR_SKEW_ROT_ORDER]: { value: ENUMS.SKR_ORDER_R_X_Y, nullable: true, propagate: true },
        [IDS.TR_ROTATION]: { value: 0, nullable: true, propagate: true },
        [IDS.TR_ROTATION_ANCHOR]: { value: ENUMS.ANCHOR_CENTER, nullable: true, propagate: true },
        [IDS.TR_SKEW_X]: { value: 0, nullable: true, propagate: true },
        [IDS.TR_SKEW_Y]: { value: 0, nullable: true, propagate: true },

    };

    _Init() {
        super._Init();
        this._variant = null;
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
            path = SVGOPS.FitPath(this, this._variant.family._contextInfos, pathData),
            refPath = path,
            flattenLayers = this._variant.Get(IDS.FLATTEN_LAYERS),
            autoW = this.Get(IDS.TR_AUTO_WIDTH),
            rw = this._variant.Resolve(IDS.WIDTH),
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
            refPath = controlVariant._computedPath;
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
                lastLayerPath = null;

            this._variant.layers.forEach((layer, index) => {
                let ref = layer.importedVariant;
                if (ref && !layer._isCircular && layer.Get(IDS.DO_EXPORT)) {

                    let
                        layerCP,
                        layerPath = ref.Get(IDS.PATH);

                    if (layer.Get(IDS.INVERTED)) { layerPath = svgpr.reverse(layerPath); }

                    if (layer.Get(IDS.LYR_USE_PREV_LAYER) && lastLayerPath) {
                        layerCP = SVGOPS.FitLayerPath(layer, lastLayerPath, ref, layerPath);
                    } else {
                        layerCP = SVGOPS.FitLayerPath(layer, refPath, ref, layerPath);
                    }

                    layer._values[IDS.PATH] = layerCP;
                    layer._CleanLayer();

                    let bb = layerCP.bbox;
                    lastLayerPath = layerCP;

                    bbmin = Math.min(bbmin, bb.left, bb.right, bb.top, bb.bottom);
                    bbmax = Math.max(bbmax, bb.left, bb.right, bb.top, bb.bottom);

                } else {
                    //prevLayerData = null; //So 'prev layer' is actually "closest valid layer"
                    layer._values[IDS.PATH] = null;
                }

                prevLayer = layer;
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

module.exports = nkm.data.Register(TransformSettingsDataBlock);