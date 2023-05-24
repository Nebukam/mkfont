'use strict';

const { uilib } = require("@nkmjs/core");
const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const u = nkm.u;
const ui = nkm.ui;

const UNICODE = require(`../../unicode`);
const SIGNAL = require(`../../signal`);
const IDS_EXT = require(`../../data/ids-ext`);
const UTILS = require(`../../data/utils`);
const mkfWidgets = require(`../../widgets`);
const PangramHeader = require(`./pangram-header`);
const PangramFooter = require(`./pangram-footer`);

const base = nkm.datacontrols.ControlView;
class PangramViewport extends base {
    constructor() { super(); }

    _Init() {
        super._Init();

    }

    _PostInit() {
        super._PostInit();
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                ...nkm.style.rules.pos.rel,
                ...nkm.style.rules.flex.column.nowrap,
                '--streamer-gap': '10px',
                'overflow': 'clip'
            },
            '.header, .search, .footer': {
                ...nkm.style.rules.item.fixed,
            },
            '.dom-stream': {
                ...nkm.style.rules.pos.rel,
                ...nkm.style.rules.item.fill,
                'overflow': 'auto',
            },
            '.dom-stream.empty': {
                'display': 'block !important'
            },
            '.search-status': {
                ...nkm.style.rules.absolute.center,
            }
        }, base._Style());
    }

    _Render() {        
        super._Render();
        this._header = this.Attach(PangramHeader, `header`);
        this._footer = this.Attach(PangramFooter, `footer`);
        this.forwardData
            .To(this._header)
            .To(this._footer);
    }

    //#endregion

}

module.exports = PangramViewport;
ui.Register(`mkf-pangram-viewport`, PangramViewport);