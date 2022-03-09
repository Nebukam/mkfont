'use strict';


const ClipboardReadSVG = require(`./cmd-clipboard-read-svg`);
const MakeTTFFont = require(`./cmd-generate-ttf-font`);
const SetAscent = require(`./cmd-action-set-ascent`);
const SetEMUnits = require(`./cmd-action-set-em-units`);
const ImportExternalFile = require(`./cmd-import-external-file`);
const ImportExternalFileMultiple = require(`./cmd-import-external-file-multiple`);

module.exports = {

    ClipboardReadSVG: new ClipboardReadSVG(),
    MakeTTFFont: new MakeTTFFont(),
    SetAscent: new SetAscent(),
    SetEMUnits: new SetEMUnits(),

    ImportExternalFile: new ImportExternalFile(),
    ImportExternalFileMultiple: new ImportExternalFileMultiple(),
    
}