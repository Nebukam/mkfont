'use strict';


const ImportClipboard = require(`./cmd-import-clipboard`);
const MakeTTFFont = require(`./cmd-generate-ttf-font`);
const SetProperty = require(`./cmd-action-set-property`);
const SetEMUnits = require(`./cmd-action-set-em`);
const ImportExternalFile = require(`./cmd-import-external-file`);
const ImportExternalFileMultiple = require(`./cmd-import-external-file-multiple`);

module.exports = {

    MakeTTFFont: new MakeTTFFont(),
    SetProperty: new SetProperty(),
    SetEM: new SetEMUnits(),

    ImportExternalFile: new ImportExternalFile(),
    ImportExternalFileMultiple: new ImportExternalFileMultiple(),
    ImportClipboard: new ImportClipboard(),
    
}