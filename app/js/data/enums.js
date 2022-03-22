
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
    static SCALE_BASELINE = 2;
    static SCALE_SPREAD = 3;
    static SCALE_HEIGHT = 4;
    static SCALE_MANUAL = 5;

    static SCALE = nkm.data.catalogs.CreateFrom({ name: `Scale`, autoSort: false }, [
        { name: `None `, [nkm.com.IDS.VALUE]: this.SCALE_NONE, icon: 'minus' },
        { name: `EM `, [nkm.com.IDS.VALUE]: this.SCALE_EM, icon: 'text-em' },
        { name: `Baseline`, [nkm.com.IDS.VALUE]: this.SCALE_BASELINE, icon: 'font-baseline' },
        { name: `Spread`, [nkm.com.IDS.VALUE]: this.SCALE_SPREAD, icon: 'font-bounds-h' },
        { name: `Height`, [nkm.com.IDS.VALUE]: this.SCALE_HEIGHT, icon: 'spread-ver' },
        { name: `Manual`, [nkm.com.IDS.VALUE]: this.SCALE_MANUAL, icon: 'edit' },
    ]);


    static VALIGN_TOP = 0;
    static VALIGN_BASELINE = 1;
    static VALIGN_DESC = 2;
    static VALIGN_SPREAD = 3;

    static VALIGN = nkm.data.catalogs.CreateFrom({ name: `Vertical anchoring`, autoSort: false }, [
        { name: `Top `, [nkm.com.IDS.VALUE]: this.VALIGN_TOP, icon: 'font-ascender' },
        { name: `Baseline`, [nkm.com.IDS.VALUE]: this.VALIGN_BASELINE, icon: 'font-baseline' },
        { name: `Descender`, [nkm.com.IDS.VALUE]: this.VALIGN_DESC, icon: 'font-descender' },
        { name: `Vertical spread`, [nkm.com.IDS.VALUE]: this.VALIGN_SPREAD, icon: 'center-ver' },
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
        { name: `Left`, [nkm.com.IDS.VALUE]: `left`, icon: 'text-align-left' },
        { name: `Center`, [nkm.com.IDS.VALUE]: `center`, icon: 'text-align-center' },
        { name: `Right`, [nkm.com.IDS.VALUE]: `right`, icon: 'text-align-right' },
    ]);

    static PANGRAM_DIR = nkm.data.catalogs.CreateFrom({ name: `Direction`, autoSort: false }, [
        { name: `LTR`, [nkm.com.IDS.VALUE]: `ltr`, icon: 'text-direction-ltr' },
        { name: `RTL`, [nkm.com.IDS.VALUE]: `rtl`, icon: 'text-direction-rtl' },
    ]);


}

module.exports = ENUMS;