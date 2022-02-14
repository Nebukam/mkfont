'use strict';

const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const operations = require(`../../operations/index`);

const mkfData = require(`../../data`);

class GlyphInspector extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._svgPaste = operations.commands.ClipboardReadSVG;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
            },
            '.svgBox':{
                'width':'100px',
                'height':'100px'
            }
        }, super._Style());
    }

    _Render() {
        super._Render();
        this._img = ui.dom.El(`div`, { class: 'svgBox' }, this);
    }

    _OnDataUpdated(p_data){
        super._OnDataUpdated(p_data);
        //console.log(p_data.data.svg);
        this._img.innerHTML = p_data.data.svg;
    }

    _OnDisplayGain() {
        super._OnDisplayGain();
        this._svgPaste.emitter = this;
        this._svgPaste.Enable();
    }

    _OnDisplayLost() {
        super._OnDisplayLost();
        if(this._svgPaste.emitter == this){ this._svgPaste.Disable(); }
    }

}

module.exports = GlyphInspector;