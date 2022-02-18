'use strict';

const nkm = require(`@nkmjs/core`);
const dom = nkm.ui.dom;
const u = nkm.utils;
const io = nkm.io;

const IDS = require(`./ids`);


class GlyphVariantDataBlock extends nkm.data.SimpleDataBlock {

    constructor() { super(); }

    static NULL = new GlyphVariantDataBlock();

    _Init() {

        super._Init();

        this._glyph = null;
        this._isDefault = false;
        this._xml = document.createElement(`glyph`);

        this._svg = null;
        this._viewBox = null;

        this._values = {
            [IDS.H_ORIGIN_X]: { value: null },
            [IDS.H_ORIGIN_Y]: { value: null },
            [IDS.H_ADV_X]: { value: null },
            [IDS.V_ORIGIN_X]: { value: null },
            [IDS.V_ORIGIN_Y]: { value: null },
            [IDS.V_ADV_Y]: { value: null },
            [IDS.PATH]: { value: '' }
        }

        // Variant manangement : UI should show a drop-down allowing to assign a variant found in the Family object
        // if a variant is deleted, flag this variant as "unassigned"
        // if a variant is added whille glyph have unassigned variants : 

    }

    get xml() { return this._xml; }

    set glyph(p_value) { this._glyph = p_value; }
    get glyph() { return this._glyph; }

    set variant(p_variant) {
        if (this._variant == p_variant) { return; }
        this._variant = p_variant;
        if (this._variant) { this._variant.xml.appendChild(this._xml); }
        else { this._xml.remove(); }
    }

    set unicode(p_value) { this._xml.setAttribute(`unicode`, p_value); }

    get svg() { return this._svg; }
    set svg(p_svg) {
        this._svg = p_svg;
        this.CommitUpdate();
    }

    CommitUpdate() {
        this._xml.innerHTML = this._svg ? this._svg.outerHTML : ``;
        dom.SAtt(this._xml, this._params, `value`, true);
        super.CommitUpdate();
    }

    _CleanUp() {
        this.glyph = null;
        this._xml.remove();
        super._CleanUp();
    }


}

module.exports = GlyphVariantDataBlock;