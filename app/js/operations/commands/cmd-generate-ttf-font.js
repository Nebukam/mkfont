// Read svg from clipboard and trigger "action-set-svg"
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;

const { clipboard } = require('electron');
const fs = require('fs');

const svg2ttf = require('svg2ttf');

const mkfData = require(`../../data`);

const ActionSetPathData = require(`../actions/action-set-path-data`);

class CmdGenerateTTFFont extends actions.Command {
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

        let
            family = this._context,
            bytes = SVGOPS.TTFFontFromSubFamily(family.defaultSubFamily);
            
        try{
        fs.writeFileSync('./assets/myfont.ttf', Buffer.from(bytes));
        }catch(e){
            console.log(e);
        }

        //console.log(svgFont);

        this._Success();

    }

}

module.exports = CmdGenerateTTFFont;
