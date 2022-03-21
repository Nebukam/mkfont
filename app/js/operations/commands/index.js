'use strict';

const MakeTTFFont = require(`./cmd-generate-ttf-font`);
const SetProperty = require(`./cmd-action-set-property`);
const SetEMUnits = require(`./cmd-action-set-em`);
const ImportImportTTF = require(`./cmd-import-ttf`);
const ImportEmpty = require(`./cmd-import-empty`);
const ImportClipboard = require(`./cmd-import-clipboard`);
const ImportExternalFile = require(`./cmd-import-external-file`);
const ImportExternalFileMultiple = require(`./cmd-import-external-file-multiple`);
const DeleteGlyph = require(`./cmd-glyph-delete`);
const ExportToClipboard = require(`./cmd-export-to-clipboard`);

module.exports = {

    MakeTTFFont: new MakeTTFFont(),
    SetProperty: new SetProperty(),
    SetEM: new SetEMUnits(),

    DeleteGlyph: new DeleteGlyph(),

    ImportImportTTF: new ImportImportTTF(),
    ImportEmpty: new ImportEmpty(),
    ImportExternalFile: new ImportExternalFile(),
    ImportExternalFileMultiple: new ImportExternalFileMultiple(),
    ImportClipboard: new ImportClipboard(),

    ExportToClipboard: new ExportToClipboard(),
    
}