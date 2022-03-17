'use strict';

const MakeTTFFont = require(`./cmd-generate-ttf-font`);
const SetProperty = require(`./cmd-action-set-property`);
const SetEMUnits = require(`./cmd-action-set-em`);
const ImportEmpty = require(`./cmd-import-empty`);
const ImportClipboard = require(`./cmd-import-clipboard`);
const ImportExternalFile = require(`./cmd-import-external-file`);
const ImportExternalFileMultiple = require(`./cmd-import-external-file-multiple`);
const DeleteGlyph = require(`./cmd-delete-glyph`);

module.exports = {

    MakeTTFFont: new MakeTTFFont(),
    SetProperty: new SetProperty(),
    SetEM: new SetEMUnits(),

    DeleteGlyph: new DeleteGlyph(),

    ImportEmpty: new ImportEmpty(),
    ImportExternalFile: new ImportExternalFile(),
    ImportExternalFileMultiple: new ImportExternalFileMultiple(),
    ImportClipboard: new ImportClipboard(),
    
}