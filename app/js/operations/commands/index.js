'use strict';


const ClipboardReadSVG = require(`./cmd-clipboard-read-svg`);
const MakeSVGFont = require(`./cmd-generate-svg-font`);
const MakeTTFFont = require(`./cmd-generate-ttf-font`);

module.exports = {

    ClipboardReadSVG: new ClipboardReadSVG(),
    MakeSVGFont: new MakeSVGFont(),
    MakeTTFFont: new MakeTTFFont()
    
}