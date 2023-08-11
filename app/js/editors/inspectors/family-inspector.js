'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;

const MiniHeader = nkm.datacontrols.widgets.MiniHeader;

const mkfData = require(`../../data`);

const base = nkm.uilib.inspectors.ValueList;
class FamilyInspector extends base {
    constructor() { super(); }

    static __controls = [
        { cl: MiniHeader, options: { label: `Definition` } },
        { options: { propertyId: mkfData.IDS.FAMILY } },
        { options: { propertyId: mkfData.IDS.FONT_STYLE } },
        { options: { propertyId: mkfData.IDS.WEIGHT_CLASS } },
        { cl: MiniHeader, options: { label: `Infos` } },
        { options: { propertyId: mkfData.IDS.COPYRIGHT } },
        //{ options: { propertyId: mkfData.IDS.METADATA } },
        { options: { propertyId: mkfData.IDS.DESCRIPTION } },
        { options: { propertyId: mkfData.IDS.URL } },
        { options: { propertyId: mkfData.IDS.VERSION } },
        //{ options: { propertyId: mkfData.IDS.COLOR_PREVIEW } },
    ];

    static __width = `350px`;

}

module.exports = FamilyInspector;