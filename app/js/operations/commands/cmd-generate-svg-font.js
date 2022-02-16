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
        let font = this._context;
        console.log(font.defaultVariant.xml);
        this._context._svgText = font.defaultVariant.xml.outerHTML;
    }

}

module.exports = CmdGenerateSVGFont;
