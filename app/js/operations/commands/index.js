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

    //Single instances are to be used with PropertyControl
    SetProperty: new (require(`./cmd-action-set-property`))(), //Single instance
    SetEM: new (require(`./cmd-action-set-em`))(), //Single instance
    SetAscent: new (require(`./cmd-action-set-ascent`))(), //Single instance
    SetLayerControl: new (require(`./cmd-action-set-control`))(), //Single instance

    GlyphDelete: require(`./cmd-glyph-delete`),
    GlyphClear: require(`./cmd-glyph-clear`),
    GlyphCopy: require(`./cmd-glyph-copy`),
    GlyphPaste: require(`./cmd-glyph-paste`),
    GlyphPasteInPlace: require(`./cmd-glyph-paste-in-place`),
    GlyphPasteTransform: require(`./cmd-glyph-paste-transform`),

    LayerAdd: require(`./cmd-layer-add`),
    LayersAddUInfos: require(`./cmd-layers-add-uinfos`),
    LayerRemove: require(`./cmd-layer-remove`),
    LayerSetControlBatch: require(`./cmd-action-set-control-batch`),
    LayerAllOff: require(`./cmd-layers-all-off`),
    LayerAllOn: require(`./cmd-layers-all-on`),
    LayerUp: require(`./cmd-layer-move-up`),
    LayerDown: require(`./cmd-layer-move-down`),
    LayersPaste: require(`./cmd-layers-paste`),
    LayerAddComp: require(`./cmd-layer-add-comp`),

    LigatureFromSelection: require(`./cmd-ligature-from-selection`),

    ImportTTF: require(`./cmd-import-ttf`),

    ImportListMissingGlyphs: require(`./cmd-import-list-missing-glyphs`),
    ImportFileSingle: require(`./cmd-import-file-single`),
    ImportFileList: require(`./cmd-import-file-list`),
    ImportLigatures: require(`./cmd-import-ligatures`),
    ImportMKFont: require(`./cmd-import-mkfont`),

    ExportTTF: require(`./cmd-export-ttf`),

    ExportListUni: require(`./cmd-export-list-uni`),
    ExportListUniHex: require(`./cmd-export-list-uni-hex`),
    ExportSingleUniHex: new (require(`./cmd-export-single-uni-hex-`))(),
    ExportListArtboardTemplate: require(`./cmd-export-list-artboard-template`),

    StartNewFromTTF: require(`./cmd-start-new-from-ttf`),
    StartNewFromSVGS: require(`./cmd-start-new-from-svgs`),

    get CreateFamilyDoc() { return docCmds.DocumentCreate.Rent({ name: `New .mkfont`, ...mkDocInfos }) },
    get SaveFamilyDoc() { return docCmds.DocumentSave.Rent({ name: `Save .mkfont`, ...mkDocInfos }) },
    get LoadFamilyDoc() { return docCmds.DocumentLoad.Rent({ name: `Load .mkfont`, ...mkDocInfos }) },
    get ReleaseFamilyDoc() { return docCmds.DocumentRelease.Rent({ ...mkDocInfos }) },

    EditInExternalEditor: require(`./cmd-edit-in-external-editor`),
}