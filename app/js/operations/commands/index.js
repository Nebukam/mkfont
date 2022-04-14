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

    SetProperty: new (require(`./cmd-action-set-property`))(), //Single instance
    SetEM: new (require(`./cmd-action-set-em`))(), //Single instance
    SetAscent: new (require(`./cmd-action-set-ascent`))(), //Single instance

    GlyphDelete: require(`./cmd-glyph-delete`),
    GlyphClear: require(`./cmd-glyph-clear`),
    GlyphCopy: require(`./cmd-glyph-copy`),
    GlyphPaste: require(`./cmd-glyph-paste`),

    ImportTTF: new (require(`./cmd-import-ttf`))(),

    ImportListMissingGlyphs: require(`./cmd-import-list-missing-glyphs`),
    ImportExternalFile: new (require(`./cmd-import-external-file`))(),
    ImportExternalFileMultiple: new (require(`./cmd-import-external-file-multiple`))(),
    ImportTextLiga: new (require(`./cmd-import-text-liga`))(),

    ExportTTF: require(`./cmd-export-ttf`),

    ExportListUni: require(`./cmd-export-list-uni`),
    ExportListUniHex: require(`./cmd-export-list-uni-hex`),
    ExportSingleUniHex: new (require(`./cmd-export-single-uni-hex-`))(),

    StartNewFromTTF: new (require(`./cmd-start-new-from-ttf`))(),
    StartNewFromSVGS: new (require(`./cmd-start-new-from-svgs`))(),

    get CreateFamilyDoc() { return docCmds.DocumentCreate.Rent({ name: `New .mkfont`, ...mkDocInfos }) },
    get SaveFamilyDoc() { return docCmds.DocumentSave.Rent({ name: `Save .mkfont`, ...mkDocInfos }) },
    get LoadFamilyDoc() { return docCmds.DocumentLoad.Rent({ name: `Load .mkfont`, ...mkDocInfos }) },
    get ReleaseFamilyDoc() { return docCmds.DocumentRelease.Rent({ ...mkDocInfos }) },

    EditInExternalEditor: require(`./cmd-edit-in-external-editor`),
    IllustratorArtboards: new (require(`./cmd-illustrator-artboards`))(),
}