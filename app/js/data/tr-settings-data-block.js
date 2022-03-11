'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.utils;
const io = nkm.io;

const SimpleDataEx = require(`./simple-data-ex`);
const IDS = require(`./ids`);
const SVG = require(`../operations/svg-operations`);

class TransformSettingsDataBlock extends SimpleDataEx {

    constructor() { super(); }

    _Init() {

        super._Init();

        this._values = {
            [IDS.TR_SCALE_MODE]: { value: IDS.trScaleModes.At(2) },
            [IDS.TR_SCALE_FACTOR]: { value: 10 },
            [IDS.TR_VER_ALIGN]: { value: IDS.trVerAlign.At(1) },
            [IDS.TR_VER_ALIGN_ANCHOR]: { value: IDS.trVerAlignAnchors.At(0) },
            [IDS.TR_HOR_ALIGN]: { value: IDS.trHorAlign.At(0) },
            [IDS.TR_HOR_ALIGN_ANCHOR]: { value: IDS.trHorAlignAnchors.At(0) },
            [IDS.TR_WIDTH_SHIFT]: { value: 0 },
            [IDS.TR_WIDTH_PUSH]: { value: 0 },

        }

        this._glyphVariantOwner = null;

    }

    set glyphVariantOwner(p_value) { this._glyphVariantOwner = null; }

    CommitUpdate() {
        super.CommitUpdate();
        if (this._glyphVariantOwner) { this.UpdateTransform(); }
    }

    UpdateTransform() {
        let path = SVG.FitPath(this,
            this._glyphVariantOwner.subFamily._contextInfos,
            this._glyphVariantOwner.Get(IDS.PATH_DATA)
        );

        this._glyphVariantOwner.Set(IDS.PATH, path.path);
    }

    _CleanUp() {
        super._CleanUp();
    }


}

module.exports = TransformSettingsDataBlock;