// Read svg from clipboard and trigger "action-set-svg"
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const { clipboard } = require('electron');
const fs = require('fs');

const svg2ttf = require('svg2ttf');

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

        if (nkm.utils.isInstanceOf(this._emitter.data, mkfData.Family)) {
            return this._emitter.data;
        }

        return null;

    }

    _InternalExecute() {

        let family = this._context,
            ttf = svg2ttf(family.defaultSubFamily.xml.outerHTML, {});
        fs.writeFileSync('./assets/myfont.ttf', Buffer.from(ttf.buffer));

        //console.log(svgFont);

    }

}

module.exports = CmdGenerateSVGFont;
