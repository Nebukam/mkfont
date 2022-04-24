const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const ContentUpdater = require(`../content-updater`);
const SIGNAL = require(`../signal`);
const mkfData = require(`../data`);
const mkfWidgets = require(`../widgets`);

const base = nkm.datacontrols.ControlView;
class FontEditorFooter extends base {
    constructor() { super(); }

    _Init() {
        super._Init();
        ContentUpdater.instance
            .Watch(nkm.com.SIGNAL.UPDATED, this._OnContentUpdate, this)
            .Watch(nkm.com.SIGNAL.READY, this._OnContentUpdateComplete, this);
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'flex',
                'min-height': '8px',
                'height': '8px'
            },
            '.progress': {
                'position':'absolute',
                'width': '100%',
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