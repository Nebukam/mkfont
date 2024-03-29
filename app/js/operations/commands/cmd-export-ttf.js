'use strict';

const nkm = require(`@nkmjs/core`);
const actions = nkm.actions;
const u = nkm.u;

const fs = require('fs');
const svg2ttf = require('svg2ttf');

const IDS = require(`../../data/ids`);
const ContentManager = require(`../../content-manager`);

class CmdExportTTF extends actions.Command {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._Bind(this._OnContentReady);
    }

    _InternalExecute() {

        if (this._context._glyphs.length == 0) {
            this._Fail(`There is no glyph to export.`);
            return;
        }

        if (!ContentManager.ready) {

            this._blockingDialog = nkm.dialog.Push({
                title: `Processing`,
                message: `Please wait...`,
                icon: `load-arrow`,
                origin: this,
            });

            ContentManager.Watch(nkm.com.SIGNAL.READY, this._OnContentReady);
        } else {
            this._OnContentReady();
            this._Success();
        }

    }

    _OnContentReady() {
        ContentManager.Unwatch(nkm.com.SIGNAL.READY, this._OnContentReady);
        try {

            let
                family = this._context,
                ttf = svg2ttf(family.fontObject.outerHTML, {
                    familyname: family.Resolve(IDS.FAMILY) || `unamed-mkfont`,
                    subfamilyname: family.Resolve(IDS.FONT_STYLE) || `regular`,
                    copyright: family.Resolve(IDS.COPYRIGHT) || `mkfont`,
                    description: family.Resolve(IDS.DESCRIPTION) || `Made with mkfont`,
                    url: family.Resolve(IDS.URL) || `https://github.com/Nebukam/mkfont`,
                    version: family.Resolve(IDS.VERSION) || `1.0`,
                });

            u.Download(`font`, ttf.buffer, u.MIME.Get(`.ttf`));
            this._Success();

        } catch (e) {
            this._Fail(e);
        }
    }

    _End() {
        if (this._blockingDialog) { this._blockingDialog.Consume(); }
        super._End();
    }

}

module.exports = CmdExportTTF;