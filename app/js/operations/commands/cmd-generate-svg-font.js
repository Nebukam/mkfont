// Read svg from clipboard and trigger "action-set-svg"
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const { clipboard } = require('electron');

const mkfData = require(`../../data`);

const ActionSetSVG = require(`../actions/action-set-svg`);
const SVG = require(`../svg-operations`);

class CmdGenerateSVGFont extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
        this.Disable();
    }

    _FetchContext() {

        if (nkm.utils.isInstanceOf(this._emitter.data, mkfData.Font)) {
            return this._emitter.data;
        }

        return null;

    }

    _InternalExecute() {


        let
            font = this._context,
            tokens = {
                id: `font_id`,
                horiz_x: 1000,
                family: `Super Sans`,
                font_weight: `bold`,
                font_style: `normal`,
                units_per_em: 1000,
                cap_height: 1000,
                x_height: 400,
                ascent: 700,
                descent: 300,
                descent: 300,
            },
            missingGlyph = ``, //Need glyph
            glyphArray = font._glyphs._array,
            glyphList = ``;

        for (let i = 0, n = glyphArray.length; i < n; i++) {
            let
                glyph = glyphArray[i],
                glyphString = `<glyph unicode="${glyph.unicode}" >${glyph.svg}</glyph>`;

            glyphList += glyphString;
        }

        let svgFont =
            `<font id="${tokens.id}" horiz-adv-x="${tokens.horiz_x}">` +
            `<font-face font-family="${tokens.family}" font-weight="${tokens.font_weight}" font-style="${tokens.font_style}"` +
            `units-per-em="${tokens.units_per_em}" cap-height="${tokens.cap_height}" x-height="${tokens.x_height}"` +
            `ascent="700" descent="300"` +
            `alphabetic="0" mathematical="350" ideographic="400" hanging="500">` +
            `<font-face-src>` +
            `<font-face-name name="Super Sans Bold"/>` +
            `</font-face-src>` +
            `</font-face>` +
            `<missing-glyph>${missingGlyph}</missing-glyph>` +
            `${glyphList}` +
            `</font>`;

        console.log(svgFont);

    }

}

module.exports = CmdGenerateSVGFont;
