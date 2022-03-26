'use strict';

const MakeTTFFont = require(`./cmd-generate-ttf-font`);
const SetProperty = require(`./cmd-action-set-property`);

const SetEMUnits = require(`./cmd-action-set-em`);
const SetAscent = require(`./cmd-action-set-ascent`);

const ImportTTF = require(`./cmd-import-ttf`);
const ImportEmpty = require(`./cmd-import-empty`);
const ImportClipboard = require(`./cmd-import-clipboard`);
const ImportExternalFile = require(`./cmd-import-external-file`);
const ImportExternalFileMultiple = require(`./cmd-import-external-file-multiple`);
const ImportTextLiga = require(`./cmd-import-text-liga`);

const DeleteGlyph = require(`./cmd-glyph-delete`);

const ExportToClipboard = require(`./cmd-export-to-clipboard`);
const ExportTTF = require(`./cmd-export-ttf`);

const OpenMKFont = require(`./cmd-open-mkfont`);
const StartNewMKFont = require(`./cmd-start-new-mkfont`);
const StartNewFromTTF = require(`./cmd-start-new-from-ttf`);
const StartNewFromSVGS = require(`./cmd-start-new-from-svgs`);

module.exports = {

    MakeTTFFont: new MakeTTFFont(),
    SetProperty: new SetProperty(),
    SetEM: new SetEMUnits(),
    SetAscent: new SetAscent(),

    DeleteGlyph: new DeleteGlyph(),

    ImportTTF: new ImportTTF(),
    ImportEmpty: new ImportEmpty(),
    ImportExternalFile: new ImportExternalFile(),
    ImportExternalFileMultiple: new ImportExternalFileMultiple(),
    ImportClipboard: new ImportClipboard(),
    ImportTextLiga: new ImportTextLiga(),

    ExportTTF: new ExportTTF(),

    ExportToClipboard: new ExportToClipboard(),

    OpenMKFont : new OpenMKFont(),
    
    StartNewMKFont: new StartNewMKFont(),
    StartNewFromTTF: new StartNewFromTTF(),
    StartNewFromSVGS: new StartNewFromSVGS(),
    
}