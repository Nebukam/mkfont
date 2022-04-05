'use strict';

const docCmds = nkm.documents.commands;

const mkfDocuments = require(`../../documents`);
const mkfData = require(`../../data`);

const
    fileInfos = { name: 'MKFont files', extensions: ['mkfont'] },
    docType = mkfDocuments.Family,
    dataType = mkfData.Family;

module.exports = {

    OpenPrefs: new (require(`./cmd-open-prefs`))(),

    MakeTTFFont: new (require(`./cmd-generate-ttf-font`))(),
    SetProperty: new (require(`./cmd-action-set-property`))(),
    SetEM: new (require(`./cmd-action-set-em`))(),
    SetAscent: new (require(`./cmd-action-set-ascent`))(),

    DeleteGlyph: new (require(`./cmd-glyph-delete`))(),

    ImportTTF: new (require(`./cmd-import-ttf`))(),
    ImportEmpty: new (require(`./cmd-import-empty`))(),
    ImportViewportEmpty: new (require(`./cmd-import-viewport-empty`))(),
    ImportExternalFile: new (require(`./cmd-import-external-file`))(),
    ImportExternalFileMultiple: new (require(`./cmd-import-external-file-multiple`))(),
    ImportClipboard: new (require(`./cmd-import-clipboard`))(),
    ImportTextLiga: new (require(`./cmd-import-text-liga`))(),

    ExportTTF: new (require(`./cmd-export-ttf`))(),

    ExportToClipboard: new (require(`./cmd-export-to-clipboard`))(),
    ExportUniClipboard: new (require(`./cmd-export-uni-clipboard`))(),
    ExportUniHexToClipboard: new (require(`./cmd-export-uni-hex-clipboard`))(),
    ExportUniHexSingleToClipboard: new (require(`./cmd-export-uni-hex-single-clipboard`))(),

    CreateFamilyDoc: docCmds.DocumentCreate.Rent({
        name: `New .mkfont`,
        docType: docType, dataType: dataType, fileInfos: fileInfos
    }, true),
    StartNewFromTTF: new (require(`./cmd-start-new-from-ttf`))(),
    StartNewFromSVGS: new (require(`./cmd-start-new-from-svgs`))(),

    SaveFamilyDoc: docCmds.DocumentSave.Rent({
        name: `Save .mkfont`,
        docType: docType, dataType: dataType, fileInfos: fileInfos
    }, true),
    LoadFamilyDoc: docCmds.DocumentLoad.Rent({
        name: `Load .mkfont`,
        docType: docType, dataType: dataType, fileInfos: fileInfos
    }, true),
    ReleaseFamilyDoc: docCmds.DocumentRelease.Rent({
        docType: docType, dataType: dataType
    }, true),

    EditInPlace: require(`./cmd-edit-in-place`),

}