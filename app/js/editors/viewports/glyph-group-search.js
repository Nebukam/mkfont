'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const MiniHeader = nkm.datacontrols.widgets.MiniHeader;
const ValueControl = nkm.datacontrols.widgets.ValueControl;

const SIGNAL = require(`../../signal`);
const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfInspectors = require(`../inspectors`);

const base = nkm.datacontrols.ControlView;
class GlyphGroupSearch extends base {
    constructor() { super(); }

    static __controls = [
        //{ cl: MiniHeader, options: { label: `Boundaries` } },
        { options: { propertyId: nkm.data.IDS.SEARCH_ENABLED, invertInputOrder:true }, css: `main-toggle` },
        { options: { propertyId: nkm.data.IDS.SEARCH_TERMS, inputOnly: true }, css: `search` },
        //{ options: { propertyId: nkm.data.IDS.SEARCH_CASE_SENSITIVE, invertInputOrder: true }, css: `large` },
        { options: { propertyId: mkfData.IDS_EXT.ADD_COMPOSITION, invertInputOrder: true }, css: `large` },
        { options: { propertyId: mkfData.IDS_EXT.MUST_EXISTS, invertInputOrder: true }, css: `large` },
    ];

    _Init() {
        super._Init();

        this._displayRange = null;

        this._dataPreProcessor = (p_owner, p_data) => {
            if (nkm.u.isInstanceOf(p_data, mkfData.Glyph)) { return p_data.family.searchSettings; }
            if (nkm.u.isInstanceOf(p_data, mkfData.GlyphVariant)) { return p_data.glyph.family.searchSettings; }
            if (nkm.u.isInstanceOf(p_data, mkfData.Family)) { return p_data.searchSettings; }
            return p_data;
        };

        this._flags.Add(this, `enabled`);

        this._dataObserver
            .Hook(nkm.data.SIGNAL.SEARCH_COMPLETE, this._OnSearchComplete, this)
            .Hook(nkm.data.SIGNAL.SEARCH_TOGGLED, this._OnSearchToggle, this)
            .Hook(nkm.data.SIGNAL.SEARCH_PROGRESS, this._OnSearchProgress, this);

        this._builder.defaultControlClass = ValueControl;
        this._builder.defaultCSS = `control`;

    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                ...nkm.style.flex.rows,
                ...nkm.style.rules.fadeIn,
                //'min-height': '0',
                //'overflow': 'auto',
                //'padding': '10px',
                'align-content': 'flex-start',
                'background-color': 'rgba(46,46,46,0.5)',
                'padding': '10px 20px 10px 20px',
                'min-height': '28px',
                //'border-radius':'5px',
                //'margin':'0 10px'
            },
            '.control': {
                ...nkm.style.flexItem.fixed,
                'margin-right': '10px',
                //'margin-bottom': '0'',
            },
            '.main-toggle': { 'flex': '0 0 115px' },
            '.search': { ...nkm.style.flexItem.fill, },
            '.large': { 'margin-right': '10px' },

            ':host(.enabled)': { 'background-color': 'rgba(var(--col-active-low-rgb),0.5)', },
            ':host(:not(.enabled)) .control:not(.main-toggle)': { opacity: 0.5, 'pointer-events': 'none' },
            '.small': {
                'flex': '1 1 45%'
            },
            '.header': {
                'margin': '5px 2px 5px 2px'
            },
            '.progress': {
                ...nkm.style.rules.tape.bottom,
            }
        }, base._Style());
    }

    _Render() {
        super._Render();
        this._progressBar = this.Attach(nkm.uilib.bars.ProgressBar, `progress`);
        this._progressBar.style.setProperty(`--size-custom`, `2px`);
        this._progressBar.options = {
            hideWhenComplete: true,
            size: ui.FLAGS.SIZE_CUSTOM,
            flavor: nkm.com.FLAGS.ACTIVE
        }
    }

    get activeSearch() { return this._data ? this._data.Get(nkm.data.IDS.SEARCH_ENABLED) : false; }

    set status(p_value) {
        this._status = p_value;
        this._status.visible = false;
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._flags.Set(`enabled`, p_data.Get(nkm.data.IDS.SEARCH_ENABLED));
    }

    _OnSearchProgress(p_progress) {
        this._status.visible = this.activeSearch;
        this._status.Progress(p_progress, this._data._results.length);
        this._progressBar.progress = p_progress;
    }

    _OnSearchComplete() {
        if (this._data._results.length == 0) {
            this._status.NoResults();
            this._status.visible = this.activeSearch;
        } else {
            this._status.visible = false;
        }
    }

    _OnSearchToggle() {
        if (this.activeSearch) {
            if (this._data.running) { this._status.visible = false; }
            else { this._OnSearchComplete(); }
        } else {
            this._status.visible = false;
        }
    }


}

module.exports = GlyphGroupSearch;
ui.Register(`mkf-glyph-group-search`, GlyphGroupSearch);