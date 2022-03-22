const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const ContentUpdater = require(`../content-updater`);
const SIGNAL = require(`../signal`);
const mkfData = require(`../data`);
const mkfWidgets = require(`../widgets`);

class FontEditorFooter extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._dataObserver.Hook(SIGNAL.SUBFAMILY_CHANGED, this._OnSubFamilyChanged, this);
        ContentUpdater.instance
            .Watch(nkm.com.SIGNAL.UPDATED, this._OnContentUpdate, this)
            .Watch(nkm.com.SIGNAL.READY, this._OnContentUpdateComplete, this);
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'flex',
                'min-height': '20px',
                'height': '20px'
            },
            '.progress': {
                'position':'absolute',
                'width': '100%',
                'height': '20px'
            },
            '.progress-bar': {
                'position':'absolute',
                'box-sizing':'border-box',
                'transition':'all 0.05s ease',
                'width': 'var(--progress, 0%)',
                'height': '100%',
                'background-color':'rgba(var(--col-loading-rgb),0.1)',
                'border-right':'2px solid var(--col-loading)'
            }
        }, super._Style());
    }

    _Render() {
        super._Render();
        this._progressBar = ui.El(`div`, { class: `progress` }, this._host);
        ui.El(`div`, { class: `progress-bar` }, this._progressBar);

        this._progressLabel = new ui.manipulators.Text(ui.El(`div`, { class: `label` }, this._progressBar));
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        if (this._data) {
            this._OnSubFamilyChanged(this._data.selectedSubFamily);
        }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        //this._pangramRenderer._scheduledDraw.Schedule();
    }

    _OnSubFamilyChanged(p_subFamily) {

    }

    //

    _OnContentUpdate(p_processed, p_total) {
        this._progressBar.style.setProperty(`--progress`, `${Math.round((p_processed / p_total)* 100)}%`);
        this._progressLabel.Set(`${p_processed} / ${p_total}`);
    }

    _OnContentUpdateComplete() {
        this._progressBar.style.setProperty(`--progress`, `0%`);
        this._progressLabel.Set(`---`);
    }

}

module.exports = FontEditorFooter;
ui.Register(`mkfont-font-editor-footer`, FontEditorFooter);