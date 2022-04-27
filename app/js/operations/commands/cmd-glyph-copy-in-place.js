//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const { clipboard } = require('electron');
const fs = require('fs');

const UNICODE = require(`../../unicode`);
const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

class CmdGlyphCopyInPlace extends actions.Command {
    constructor() { super(); }

    _InternalExecute() {

        let family = this._emitter.data,
            infoList = this._emitter.inspectedData.stack._array;

        if (globalThis.__mkfGlyphCopies) { globalThis.__mkfGlyphCopies.length = 0; }
        globalThis.__mkfGlyphCopies = null;

        if (infoList.length == 0) {
            this._Cancel();
            return;
        }

        let copies = [];

        for (let i = 0; i < infoList.length; i++) {

            let
                unicodeInfos = infoList[i],
                glyph = family.GetGlyph(unicodeInfos.u);

            if (glyph.isNull) { continue; }

            let
                variant = glyph.activeVariant,
                copy = {
                    unicode: unicodeInfos,
                    glyphValues: glyph.Values(),
                    variantValues: variant.Values(),
                    transforms: variant._transformSettings.Values()
                };

            //Cleanup
            delete copy.variantValues[mkfData.IDS.PATH];
            copy.variantValues[mkfData.IDS.PATH_DATA] = { ...variant._values[mkfData.IDS.PATH_DATA].value };


            copies.push(copy);

        }

        if (copies.length == 0) {
            this._Cancel();
            return;
        }

        globalThis.__mkfGlyphCopies = copies;
        globalThis.__mkfGlyphCopiesEM = family.Get(mkfData.IDS.EM_UNITS);


        this._Success();
    }

}

module.exports = CmdGlyphCopyInPlace;