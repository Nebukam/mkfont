//
const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.utils;

const fs = require('fs');
const svg2ttf = require('svg2ttf');

const IDS = require(`../../data/ids`);
const ContentUpdater = require(`../../content-updater`);

class CmdExportTTF extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._Bind(this._OnContentReady);
    }

    _InternalExecute() {

        if (this._context._glyphs.count == 0) {
            this._Fail(`There is no glyph to export.`);
            return;
        }

        if (!ContentUpdater.ready) {
            ContentUpdater.Watch(nkm.com.SIGNAL.READY, this._OnContentReady);
        } else {
            this._OnContentReady();
            this._Success();
        }

    }

    _OnContentReady() {
        ContentUpdater.Unwatch(nkm.com.SIGNAL.READY, this._OnContentReady);
        try {

            let
                family = this._context,
                subFamily = family.selectedSubFamily,
                ttf = svg2ttf(subFamily.fontObject.outerHTML, {
                    familyname: subFamily.Resolve(IDS.FAMILY),
                    subfamilyname: subFamily.Resolve(IDS.FONT_STYLE),
                    copyright: subFamily.Resolve(IDS.COPYRIGHT) || `mkfont`,
                    description: subFamily.Resolve(IDS.DESCRIPTION) || `Made with mkfont`,
                    url: subFamily.Resolve(IDS.URL) || `https://github.com/Nebukam/mkfont`,
                    version: subFamily.Resolve(IDS.VERSION) || `1.0`,
                });

            u.Download(`font`, ttf.buffer, u.MIME.Get(`.ttf`));
            this._Success();

        } catch (e) {
            this._Fail(e);
        }
    }

}

module.exports = CmdExportTTF;