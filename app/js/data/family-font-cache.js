'use strict';

const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const u = nkm.u;

const svg2ttf = require('svg2ttf');

const IDS_PREFS = require(`./ids-prefs`);
const ContentManager = require(`../content-manager`);

class FamilyFontCache {
    constructor(p_data) {

        this._RebuildCache = this._RebuildCache.bind(this);

        this._fontData = p_data;
        this._tempFont = null;
        this._tempFontUID = u.tils.UUID;

        this._scheduledRebuild = nkm.com.DelayedCall(this._RebuildCache.bind(this), 500);

        ContentManager.Watch(nkm.com.SIGNAL.READY, this._OnContentReady, this);

    }

    get uuid() { return this._tempFontUID; }

    _OnContentReady() {

        let
            glyphCount = this._fontData._glyphs.count,
            threshold = nkm.env.APP.PGet(IDS_PREFS.MANUAL_PREVIEW_REFRESH_THRESHOLD);

        if (glyphCount > threshold) { return; }

        //this._RebuildCache();
        this._scheduledRebuild.Bump();

    }

    _RebuildCache() {

        if (!ContentManager.ready) {
            this._scheduledRebuild.Bump();
            return;
        }

        let ttf;

        try {
            ttf = svg2ttf(this._fontData.fontObject.outerHTML, {});
        } catch (e) {
            console.log(e);
            return;
        }

        let base64 = u.tils.BytesToBase64(ttf.buffer);

        try {
            if (this._tempFont) { document.fonts.delete(this._tempFont); }
            this._tempFont = new FontFace(this._tempFontUID, `url(data:application/octet-stream;charset=utf-8;base64,${base64}) format('truetype')`);
            document.fonts.add(this._tempFont);
        } catch (e) {
            console.log(e);
        }

    }

}

module.exports = FamilyFontCache;