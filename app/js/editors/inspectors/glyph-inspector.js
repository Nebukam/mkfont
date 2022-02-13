'use strict';

const nkm = require(`@nkmjs/core`);
const operations = require(`../../operations/index`);

class GlyphInspector extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._svgPaste = operations.commands.ClipboardReadSVG;
        this._svgPaste.Enable();
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
            },
        }, super._Style());
    }

}

module.exports = GlyphInspector;