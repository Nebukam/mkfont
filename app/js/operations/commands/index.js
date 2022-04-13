'use strict';

const docCmds = nkm.documents.commands;

const mkfData = require(`../../data`);

const
    fileInfos = { name: 'MKFont files', extensions: ['mkfont'] },
    mkDocInfos = { docType: nkm.documents.bound.JSONDocument, dataType: mkfData.Family, fileInfos: fileInfos };

// Register defaults commands (will be used by autosave)
docCmds.DocumentCreate.Rent(mkDocInfos, true);
docCmds.DocumentSave.Rent(mkDocInfos, true);
docCmds.DocumentLoad.Rent(mkDocInfos, true);
docCmds.DocumentRelease.Rent(mkDocInfos, true);

module.exports = {

    OpenPrefs: new (require(`./cmd-open-prefs`))(),

    SetProperty: new (require(`./cmd-action-set-property`))(),
    SetEM: new (require(`./cmd-action-set-em`))(),
    SetAscent: new (require(`./cmd-action-set-ascent`))(),

    DeleteGlyph: new (require(`./cmd-glyph-delete`))(),

    ImportTTF: new (require(`./cmd-import-ttf`))(),
    ImportEmpty: require(`./cmd-import-empty`),
    ImportViewportEmpty: new (require(`./cmd-import-viewport-empty`))(),
    ImportExternalFile: new (require(`./cmd-import-external-file`))(),
    ImportExternalFileMultiple: new (require(`./cmd-import-external-file-multiple`))(),
    ImportClipboard: new (require(`./cmd-import-clipboard`))(),
    ImportTextLiga: new (require(`./cmd-import-text-liga`))(),

    ExportTTF: require(`./cmd-export-ttf`),

    ExportToClipboard: new (require(`./cmd-export-to-clipboard`))(),
    ExportUniClipboard: new (require(`./cmd-export-uni-clipboard`))(),
    ExportUniHexToClipboard: new (require(`./cmd-export-uni-hex-clipboard`))(),
    ExportUniHexSingleToClipboard: new (require(`./cmd-export-uni-hex-single-clipboard`))(),

    StartNewFromTTF: new (require(`./cmd-start-new-from-ttf`))(),
    StartNewFromSVGS: new (require(`./cmd-start-new-from-svgs`))(),

    get CreateFamilyDoc() { return docCmds.DocumentCreate.Rent({ name: `New .mkfont`, ...mkDocInfos }) },
    get SaveFamilyDoc() { return docCmds.DocumentSave.Rent({ name: `Save .mkfont`, ...mkDocInfos }) },
    get LoadFamilyDoc() { return docCmds.DocumentLoad.Rent({ name: `Load .mkfont`, ...mkDocInfos }) },
    get ReleaseFamilyDoc() { return docCmds.DocumentRelease.Rent({ ...mkDocInfos }) },

    EditInExternalEditor: require(`./cmd-edit-in-external-editor`),
    IllustratorArtboards: new (require(`./cmd-illustrator-artboards`))(),
}