'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const ContentManager = require(`../content-manager`);
const SIGNAL = require(`../signal`);
const mkfData = require(`../data`);
const mkfWidgets = require(`../widgets`);

const base = nkm.datacontrols.ControlView;
class FontEditorFooter extends base {
    constructor() { super(); }

    _Init() {
        super._Init();
        ContentManager
            .Watch(nkm.com.SIGNAL.UPDATED, this._OnContentUpdate, this)
            .Watch(nkm.com.SIGNAL.READY, this._OnContentUpdateComplete, this);

            nkm.main.Watch(nkm.main.SIGNAL_MEM_MONITOR, (p_data)=>{
                let pc = (p_data.private / 4000000);
                this._memBar.progress = pc;
                this._memBar.setAttribute(`title`, `Ram usage : ${(pc * 100).toFixed(2)}% (${p_data.private/1000}Mo / 4000Mo)`);
            });
            
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                ...nkm.style.rules.pos.rel,
                ...nkm.style.flex.row.nowrap,
                'min-height': '8px',
                'height': '8px',
            },
            '.progress': {
                ...nkm.style.rules.pos.abs,
                'width': '100%',
            },
            '.membar': {
                ...nkm.style.rules.absolute.right,
                'width': `100px`,
                'height': `4px`,
                'min-height': `4px`,
                'margin-right': `10px`
            },
        }, base._Style());
    }

    _Render() {
        super._Render();
        this._progressBar = this.Attach(nkm.uilib.bars.ProgressBar, `progress`);
        this._progressBar.options = {
            size: ui.FLAGS.SIZE_XXS,
            flavor: nkm.com.FLAGS.LOADING
        }
        //this._progressLabel = new ui.manipulators.Text(ui.El(`div`, { class: `label` }, this._host));
        this._memBar = this.Attach(nkm.uilib.bars.ProgressBar, `membar`);
        this._memBar.style.setProperty(`--flavor-color`, `rgb(127,127,127)`);
        this._memBar.style.setProperty(`--flavor-color-low-rgb`, `127,127,127`);
        this._memBar.setAttribute(`title`, `Ram usage : ---% (---mb/4000mb)`);
    }

    //

    _OnContentUpdate(p_processed, p_total) {
        this._progressBar.progress = (p_processed / p_total);
        //this._progressLabel.Set(`${p_processed} / ${p_total}`);
    }

    _OnContentUpdateComplete() {
        this._progressBar.progress = 0;
        //this._progressLabel.Set(`---`);
    }

}

module.exports = FontEditorFooter;
ui.Register(`mkf-font-editor-footer`, FontEditorFooter);