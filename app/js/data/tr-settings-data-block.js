'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.utils;
const io = nkm.io;

const SimpleDataEx = require(`./simple-data-ex`);
const IDS = require(`./ids`);

class TransformSettingsDataBlock extends SimpleDataEx {

    constructor() { super(); }

    _Init() {

        super._Init();

        this._values = {
            [IDS.TR_REFERENCE]: { value: IDS.trReference.At(1) },
            [IDS.TR_SCALE_MODE]: { value: IDS.trScaleModes.At(2) },
            [IDS.TR_SCALE_FACTOR]: { value: 1 },
            [IDS.TR_VER_ALIGN]: { value: IDS.trVerAlign.At(1) },
            [IDS.TR_VER_ALIGN_ANCHOR]: { value: IDS.trVerAlignAnchors.At(0) },
            [IDS.TR_HOR_ALIGN]: { value: IDS.trHorAlign.At(0) },
            [IDS.TR_HOR_ALIGN_ANCHOR]: { value: IDS.trHorAlignAnchors.At(0) },
            [IDS.TR_WIDTH_SHIFT]: { value: 0, override: true },
            [IDS.TR_WIDTH_PUSH]: { value: 0, override: true },
        }

        this._glyphVariantOwner = null;

    }

    set glyphVariantOwner(p_value) { this._glyphVariantOwner = p_value; }

    get resolutionFallbacks() {
        if (this._glyphVariantOwner) { return [this._glyphVariantOwner._subFamily._transformSettings]; }
        else { return []; }
    }

    CommitUpdate() {
        super.CommitUpdate();
        if (this._glyphVariantOwner) { this.UpdateTransform(); }
    }

    UpdateTransform() {

        let pathData = this._glyphVariantOwner.Get(IDS.PATH_DATA);

        if (!pathData || !this._glyphVariantOwner.subFamily) { return; }

        let
            path = SVGOPS.FitPath(this,
                this._glyphVariantOwner.subFamily._contextInfos,
                pathData
            ),
            w = 0,
            oob = (path.bbox.left < -32000 ||
                path.bbox.top < -32000 ||
                path.bbox.bottom > 32000 ||
                path.bbox.right > 32000);


        if (this._values[IDS.TR_HOR_ALIGN].value != 0) {
            w = path.width;
        } else {
            w = this._glyphVariantOwner.Resolve([IDS.WIDTH]);
        }

        this._glyphVariantOwner.BatchSet({
            [IDS.WIDTH]: w,
            [IDS.PATH]: path.path,
            [IDS.OUT_OF_BOUNDS]: oob
        });

    }

    _CleanUp() {
        super._CleanUp();
    }


}

module.exports = TransformSettingsDataBlock;