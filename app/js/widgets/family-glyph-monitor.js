'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const UNICODE = require(`../unicode`);
const mkfData = require(`../data`);

const base = nkm.datacontrols.ControlWidget;
class FamilyGlyphMonitor extends base {
    constructor() { super(); }

    _Init() {
        super._Init();
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                ...nkm.style.rules.fadeIn,
                'height':'8px',
                'width':'100px',
                'display':'flex',
                'padding': '5px',
                'background-color':'rgba(0,0,0,0.5)'
            },
            '.counter': {
                ...nkm.style.rules.absolute.center,
            },
            '.progress': {
                ...nkm.style.flexItem.grow,
                'max-height':'2px'
            }
        }, base._Style());
    }

    _Render() {

        super._Render();

        this._progressBar = this.Attach(nkm.uilib.bars.ProgressBar, `progress`);
        this._progressBar.options = {
            size: ui.FLAGS.SIZE_XXS,
            flavor: nkm.com.FLAGS.LOADING
        };

        this._counter = new ui.manipulators.Text(ui.El(`span`, {class:`counter label font-xsmall`}, this._host));

    }

    _OnDataUpdated(p_data){
        super._OnDataUpdated(p_data);
        let p = p_data._glyphs.count / UNICODE.MAX_GLYPH_COUNT;
        this._progressBar.progress = p;
        this._counter.Set(`${p_data._glyphs.count} / ${UNICODE.MAX_GLYPH_COUNT}`);

        this._progressBar.flavor = p < 0.5 ? nkm.com.FLAGS.READY : p < 0.8 ? nkm.com.FLAGS.WARNING : nkm.com.FLAGS.ERROR;        
    }

}

module.exports = FamilyGlyphMonitor;
ui.Register(`mkf-family-glyph-monitor`, FamilyGlyphMonitor);