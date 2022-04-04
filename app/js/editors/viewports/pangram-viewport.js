const { uilib } = require("@nkmjs/core");
const nkm = require(`@nkmjs/core`);
const com = nkm.com;
const u = nkm.utils;
const ui = nkm.ui;

const UNICODE = require(`../../unicode`);
const SIGNAL = require(`../../signal`);
const IDS_EXT = require(`../../data/ids-ext`);
const UTILS = require(`../../data/utils`);
const mkfWidgets = require(`../../widgets`);
const PangramHeader = require(`./pangram-header`);
const PangramFooter = require(`./pangram-footer`);


class PangramViewport extends nkm.datacontrols.ControlView { //ui.views.View
    constructor() { super(); }

    _Init() {
        super._Init();

    }

    _PostInit() {
        super._PostInit();
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                '--streamer-gap': '10px',
                'overflow': 'clip'
            },
            '.header, .search, .footer': {
                'flex': '0 0 auto',
            },
            '.dom-stream': {
                'position': 'relative',
                'flex': '1 1 auto',
                'overflow': 'auto',
            },
            '.dom-stream.empty': {
                'display': 'block !important'
            },
            '.search-status': {
                '@': ['absolute-center']
            }
        }, super._Style());
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
ui.Register(`mkfont-pangram-viewport`, PangramViewport);