
'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const inputs = nkm.uilib.inputs;

/**
 * @description TODO
 * @class
 * @hideconstructor
 * @memberof ui.core
 */
class ENUMS {
    constructor() { }

    static WEIGHTS = nkm.data.catalogs.CreateFrom({ name: `Weights`, autoSort: false }, [
        { name: `Thin`, [nkm.com.IDS.VALUE]: 100 },
        { name: `Extra Light`, [nkm.com.IDS.VALUE]: 200 },
        { name: `Light`, [nkm.com.IDS.VALUE]: 300 },
        { name: `Normal`, [nkm.com.IDS.VALUE]: 400 },
        { name: `Medium`, [nkm.com.IDS.VALUE]: 500 },
        { name: `Semi Bold`, [nkm.com.IDS.VALUE]: 600 },
        { name: `Bold`, [nkm.com.IDS.VALUE]: 700 },
        { name: `Extra Bold`, [nkm.com.IDS.VALUE]: 800 },
        { name: `Black`, [nkm.com.IDS.VALUE]: 900 },
    ]);

    static MIRROR_NONE = 0;
    static MIRROR_H = 1;
    static MIRROR_V = 2;
    static MIRROR_H_AND_V = 3;

    static MIRROR = nkm.data.catalogs.CreateFrom({ name: `Transform reference`, autoSort: false }, [
        { name: `Mirror Horizontal`, [nkm.com.IDS.VALUE]: this.MIRROR_H, icon: 'mirror-hor' },
        { name: `Mirror Vertical`, [nkm.com.IDS.VALUE]: this.MIRROR_V, icon: 'mirror-ver' },
        { name: `Mirror Horizontal & Vertical`, [nkm.com.IDS.VALUE]: this.MIRROR_H_AND_V, icon: 'mirror-both' },
        { name: `Don't mirror`, [nkm.com.IDS.VALUE]: this.MIRROR_NONE, icon: 'clear' },
    ]);

    static BOUNDS_OUTSIDE = 0;
    static BOUNDS_MIXED = 1;
    static BOUNDS_INSIDE = 2;

    static BOUNDS = nkm.data.catalogs.CreateFrom({ name: `Transform reference`, autoSort: false }, [
        { name: `Imported bounds`, [nkm.com.IDS.VALUE]: this.BOUNDS_OUTSIDE, icon: 'bounds-outside' },
        { name: `Mixed bounds`, [nkm.com.IDS.VALUE]: this.BOUNDS_MIXED, icon: 'bounds-mixed' },
        { name: `Glyph bounds`, [nkm.com.IDS.VALUE]: this.BOUNDS_INSIDE, icon: 'bounds-inside' },
    ]);


    static SCALE_NONE = 0;
    static SCALE_EM = 1;
    static SCALE_ASCENDER = 2;
    static SCALE_SPREAD = 3;
    static SCALE_X_HEIGHT = 4;
    static SCALE_CAP_HEIGHT = 5;
    static SCALE_HEIGHT = 6;
    static SCALE_MANUAL = 7;
    static SCALE_NORMALIZE = 8;

    static SCALE = nkm.data.catalogs.CreateFrom({ name: `Scale`, autoSort: false }, [
        { name: `Baseline to Ascender`, [nkm.com.IDS.VALUE]: this.SCALE_ASCENDER, icon: 'font-ascender' },
        { name: `Ascender to Descender`, [nkm.com.IDS.VALUE]: this.SCALE_SPREAD, icon: 'font-bounds-h' },
        { name: `Baseline to X Height`, [nkm.com.IDS.VALUE]: this.SCALE_X_HEIGHT, icon: 'font-x-height' },
        { name: `Baseline to Cap heignt`, [nkm.com.IDS.VALUE]: this.SCALE_CAP_HEIGHT, icon: 'font-cap-height' },
        { name: `Height (from family Metrics)`, [nkm.com.IDS.VALUE]: this.SCALE_HEIGHT, icon: 'spread-ver' },
        { name: `EM (from family Metrics)`, [nkm.com.IDS.VALUE]: this.SCALE_EM, icon: 'text-em' },
        { name: `Manual`, [nkm.com.IDS.VALUE]: this.SCALE_MANUAL, icon: 'edit' },
        { name: `Normalized (uses family Metrics)`, [nkm.com.IDS.VALUE]: this.SCALE_NORMALIZE, icon: 'scale' },
        { name: `None `, [nkm.com.IDS.VALUE]: this.SCALE_NONE, icon: 'clear' },
    ]);


    static VALIGN_ASCENDER = 0;
    static VALIGN_BASELINE = 1;
    static VALIGN_DESC = 2;
    static VALIGN_SPREAD = 3;
    static VALIGN_EM = 4;

    static VALIGN = nkm.data.catalogs.CreateFrom({ name: `Vertical anchoring`, autoSort: false }, [
        { name: `Top `, [nkm.com.IDS.VALUE]: this.VALIGN_ASCENDER, icon: 'font-ascender' },
        { name: `Baseline`, [nkm.com.IDS.VALUE]: this.VALIGN_BASELINE, icon: 'font-baseline' },
        { name: `Descender`, [nkm.com.IDS.VALUE]: this.VALIGN_DESC, icon: 'font-descender' },
        { name: `Vertical spread`, [nkm.com.IDS.VALUE]: this.VALIGN_SPREAD, icon: 'center-ver' },
        { name: `EM (from Metrics)`, [nkm.com.IDS.VALUE]: this.VALIGN_EM, icon: 'text-em' },
        //{ name: `To Value`, [nkm.com.IDS.VALUE]: 2, icon: 'edit' },
    ]);


    static VANCHOR_BOTTOM = 0;
    static VANCHOR_CENTER = 1;
    static VANCHOR_TOP = 2;

    static VANCHOR = nkm.data.catalogs.CreateFrom({ name: `Anchoring alignment`, autoSort: false }, [
        { name: `Bottom `, [nkm.com.IDS.VALUE]: this.VANCHOR_BOTTOM, icon: 'align-ver-bottom' },
        { name: `Center`, [nkm.com.IDS.VALUE]: this.VANCHOR_CENTER, icon: 'align-ver-center' },
        { name: `Top`, [nkm.com.IDS.VALUE]: this.VANCHOR_TOP, icon: 'align-ver-top' },
    ]);


    static HALIGN_XMIN = 0;
    static HALIGN_XMAX = 1;
    static HALIGN_SPREAD = 2;

    static HALIGN = nkm.data.catalogs.CreateFrom({ name: `Horizontal anchoring`, autoSort: false }, [
        { name: `Bound min x`, [nkm.com.IDS.VALUE]: this.HALIGN_XMIN, icon: 'font-bounds-xmin' },
        { name: `Bound max x`, [nkm.com.IDS.VALUE]: this.HALIGN_XMAX, icon: 'font-bounds-xmax' },
        { name: `Horizontal spread`, [nkm.com.IDS.VALUE]: this.HALIGN_SPREAD, icon: 'center-hor' },
        //{ name: `To Value`, [nkm.com.IDS.VALUE]: 2, icon: 'edit' },
    ]);


    static HANCHOR_LEFT = 0;
    static HANCHOR_CENTER = 1;
    static HANCHOR_RIGHT = 2;

    static HANCHOR = nkm.data.catalogs.CreateFrom({ name: `Anchoring alignment`, autoSort: false }, [
        { name: `Left`, [nkm.com.IDS.VALUE]: this.HANCHOR_LEFT, icon: 'align-hor-left' },
        { name: `Center`, [nkm.com.IDS.VALUE]: this.HANCHOR_CENTER, icon: 'align-hor-center' },
        { name: `Right`, [nkm.com.IDS.VALUE]: this.HANCHOR_RIGHT, icon: 'align-hor-right' },
    ]);

    static PANGRAM_ALIGN = nkm.data.catalogs.CreateFrom({ name: `Align`, autoSort: false }, [
        { name: `Align left`, [nkm.com.IDS.VALUE]: `left`, icon: 'text-align-left' },
        { name: `Align center`, [nkm.com.IDS.VALUE]: `center`, icon: 'text-align-center' },
        { name: `Align right`, [nkm.com.IDS.VALUE]: `right`, icon: 'text-align-right' },
        { name: `Justify`, [nkm.com.IDS.VALUE]: `justify`, icon: 'text-align-justify' },
    ]);

    static PANGRAM_DIR = nkm.data.catalogs.CreateFrom({ name: `Direction`, autoSort: false }, [
        { name: `LTR (Left to Right)`, [nkm.com.IDS.VALUE]: `ltr`, icon: 'text-direction-ltr' },
        { name: `RTL (Right to Left)`, [nkm.com.IDS.VALUE]: `rtl`, icon: 'text-direction-rtl' },
    ]);

    static PANGRAM_TEXT_TRANSFORM = nkm.data.catalogs.CreateFrom({ name: `Case`, autoSort: false }, [
        { name: `Sentence case`, [nkm.com.IDS.VALUE]: `none`, icon: 'case-sentence' },
        { name: `Uppercase`, [nkm.com.IDS.VALUE]: `uppercase`, icon: 'case-uppercase' },
        { name: `Lowercase`, [nkm.com.IDS.VALUE]: `lowercase`, icon: 'case-lowercase' },
        { name: `Capitalize`, [nkm.com.IDS.VALUE]: `capitalize`, icon: 'case-capitalize' },
    ]);

    static OVERLAP_OVERWRITE = 0;
    static OVERLAP_PRESERVE = 1;
    static OVERLAP_IGNORE = 2;

    static OVERLAP = nkm.data.catalogs.CreateFrom({ name: `Transform reference`, autoSort: false }, [
        { name: `Overwrite transforms`, [nkm.com.IDS.VALUE]: this.OVERLAP_OVERWRITE },
        { name: `Preserve existing transforms`, [nkm.com.IDS.VALUE]: this.OVERLAP_PRESERVE },
        { name: `Don't import`, [nkm.com.IDS.VALUE]: this.OVERLAP_IGNORE },
    ]);
    

    static ASSIGN_FILENAME = 0;
    static ASSIGN_SELECTION = 1;
    static ASSIGN_SELECTION_RANGE = 2;
    static ASSIGN_FROM_BLOCK = 3;
    static ASSIGN_FROM_BLOCK_RANGE = 4;

    static ASSIGN_IMPORT_MODE = nkm.data.catalogs.CreateFrom({ name: `Transform reference`, autoSort: false }, [
        { name: `From filename`, [nkm.com.IDS.VALUE]: this.ASSIGN_FILENAME, comment: `Use imported filename to drive glyph assignment` },
        //{ name: `Start from selection`, [nkm.com.IDS.VALUE]: this.ASSIGN_SELECTION, comment: `Use the start of the active selection and fill from there` },
        { name: `To selection`, [nkm.com.IDS.VALUE]: this.ASSIGN_SELECTION_RANGE, comment: `Limit import to the current selection of glyphs` },
        { name: `To block`, [nkm.com.IDS.VALUE]: this.ASSIGN_FROM_BLOCK, comment: `Limit import to the current selection of glyphs` },
        { name: `To block (constrained)`, [nkm.com.IDS.VALUE]: this.ASSIGN_FROM_BLOCK_RANGE, comment: `Limit import to the current selection of glyphs` },
    ]);

    static BLOCK_START_BEGIN = 0;
    static BLOCK_START_FIRST_AVAIL = 1;

    static BLOCK_START_MODE = nkm.data.catalogs.CreateFrom({ name: `Block start mode`, autoSort: false }, [
        { name: `Block start`, [nkm.com.IDS.VALUE]: this.BLOCK_START_BEGIN },
        { name: `First empty slot`, [nkm.com.IDS.VALUE]: this.BLOCK_START_FIRST_AVAIL },
    ]);

    //

    static LYR_BOUNDS_OUTSIDE = 0;
    static LYR_BOUNDS_MIXED = 1;
    static LYR_BOUNDS_INSIDE = 2;

    static LYR_BOUNDS = nkm.data.catalogs.CreateFrom({ name: `Transform reference`, autoSort: false }, [
        { name: `Imported bounds`, [nkm.com.IDS.VALUE]: this.LYR_BOUNDS_OUTSIDE, icon: 'bounds-outside' },
        { name: `Mixed bounds`, [nkm.com.IDS.VALUE]: this.LYR_BOUNDS_MIXED, icon: 'bounds-mixed' },
        { name: `Glyph bounds`, [nkm.com.IDS.VALUE]: this.LYR_BOUNDS_INSIDE, icon: 'bounds-inside' },
    ]);

    static LYR_SCALE = nkm.data.catalogs.CreateFrom({ name: `Scale`, autoSort: false }, [
        { name: `Manual`, [nkm.com.IDS.VALUE]: this.SCALE_MANUAL, icon: 'edit' },
        { name: `Normalized`, [nkm.com.IDS.VALUE]: this.SCALE_NORMALIZE, icon: 'scale' },
        { name: `None `, [nkm.com.IDS.VALUE]: this.SCALE_NONE, icon: 'clear' },
    ]);

}

module.exports = ENUMS;