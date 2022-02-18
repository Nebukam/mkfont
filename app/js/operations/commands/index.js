'use strict';


const ClipboardReadSVG = require(`./cmd-clipboard-read-svg`);
const MakeTTFFont = require(`./cmd-generate-ttf-font`);

module.exports = {

    ClipboardReadSVG: new ClipboardReadSVG(),
    MakeTTFFont: new MakeTTFFont()

}