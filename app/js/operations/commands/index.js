'use strict';

module.exports = {

    MakeTTFFont: new (require(`./cmd-generate-ttf-font`))(),
    SetProperty: new (require(`./cmd-action-set-property`))(),
    SetEM: new (require(`./cmd-action-set-em`))(),
    SetAscent: new (require(`./cmd-action-set-ascent`))(),

    DeleteGlyph: new (require(`./cmd-glyph-delete`))(),

    ImportTTF: new (require(`./cmd-import-ttf`))(),
    ImportEmpty: new (require(`./cmd-import-empty`))(),
    ImportExternalFile: new (require(`./cmd-import-external-file`))(),
    ImportExternalFileMultiple: new (require(`./cmd-import-external-file-multiple`))(),
    ImportClipboard: new (require(`./cmd-import-clipboard`))(),
    ImportTextLiga: new (require(`./cmd-import-text-liga`))(),

    ExportTTF: new (require(`./cmd-export-ttf`))(),


    ExportToClipboard: new (require(`./cmd-export-to-clipboard`))(),
    ExportUniClipboard: new (require(`./cmd-export-uni-clipboard`))(),
    ExportUniHexToClipboard: new (require(`./cmd-export-uni-hex-clipboard`))(),

    OpenMKFont: new (require(`./cmd-open-mkfont`))(),

    StartNewMKFont: new (require(`./cmd-start-new-mkfont`))(),
    StartNewFromTTF: new (require(`./cmd-start-new-from-ttf`))(),
    StartNewFromSVGS: new (require(`./cmd-start-new-from-svgs`))(),

    IOSaveFamily: new (require(`./cmd-io-save-family`))(),
    IOLoadFamily: new (require(`./cmd-io-load-family`))(),

}