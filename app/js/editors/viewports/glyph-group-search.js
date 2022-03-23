const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const SIGNAL = require(`../../signal`);
const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfInspectors = require(`../inspectors`);

class GlyphGroupSearch extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    static __controls = [
        //{ cl: mkfWidgets.ControlHeader, options: { label: `Boundaries` }, css: 'header' },
        { options: { propertyId: mkfData.IDS_EXT.SEARCH_ENABLED }, css: `main-toggle` },
        { options: { propertyId: mkfData.IDS_EXT.SEARCH_TERM, inputOnly: true } },
        //{ options: { propertyId: mkfData.IDS_EXT.CASE_INSENSITIVE, invertInputOrder: true }, css: `large` },
        { options: { propertyId: mkfData.IDS_EXT.ADD_COMPOSITION, invertInputOrder: true }, css: `large` },
        { options: { propertyId: mkfData.IDS_EXT.MUST_EXISTS, invertInputOrder: true }, css: `large` },
    ];

    _Init() {
        super._Init();

        this._displayRange = null;

        this._dataPreProcessor = (p_owner, p_data) => {
            if (nkm.utils.isInstanceOf(p_data, mkfData.Glyph)) { return p_data.family.searchSettings; }
            if (nkm.utils.isInstanceOf(p_data, mkfData.GlyphVariant)) { return p_data.glyph.family.searchSettings; }
            if (nkm.utils.isInstanceOf(p_data, mkfData.SubFamily)) { return p_data.family.searchSettings; }
            if (nkm.utils.isInstanceOf(p_data, mkfData.Family)) { return p_data.searchSettings; }
            return p_data;
        };

        this._flags.Add(this, `enabled`);

        this._dataObserver
            .Hook(SIGNAL.SEARCH_COMPLETE, this._OnSearchComplete, this)
            .Hook(SIGNAL.SEARCH_TOGGLED, this._OnSearchToggle, this)
            .Hook(SIGNAL.SEARCH_PROGRESS, this._OnSearchProgress, this);

        this._builder.defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                '@': ['fade-in'],
                'display': 'flex',
                'flex-flow': 'row nowrap',
                //'min-height': '0',
                //'overflow': 'auto',
                //'padding': '10px',
                'align-content': 'flex-start',
                'background-color': 'rgba(46,46,46,0.5)',
                'padding': '10px 20px',
                'min-height': '28px',
                //'border-radius':'5px',
                //'margin':'0 10px'
            },
            '.control': {
                'flex': '0 1 auto',
                'margin-right': '10px'
            },
            '.main-toggle': { 'min-width': '100px', },
            '.large': { 'margin-right': '30px' },

            ':host(.enabled)': { 'background-color': 'rgba(var(--col-active-dark-rgb),0.5)', },
            ':host(:not(.enabled)) .control:not(.main-toggle)': { opacity: 0.5, 'pointer-events': 'none' },
            '.small': {
                'flex': '1 1 45%'
            },
            '.header': {
                'margin': '5px 2px 5px 2px'
            },
            '.progress': {
                'position': 'absolute',
                'bottom': '0',
                'left': '0',
                'width': '100%'
            }
        }, super._Style());
    }

    _Render() {
        super._Render();
        this._progressBar = this.Add(nkm.uilib.bars.ProgressBar, `progress`);
        this._progressBar.style.setProperty(`--size-custom`, `2px`);
        this._progressBar.options = {
            hideWhenComplete: true,
            size: ui.FLAGS.SIZE_CUSTOM,
            flavor: nkm.com.FLAGS.ACTIVE
        }
    }

    get activeSearch() { return this._data ? this._data.Get(mkfData.IDS_EXT.SEARCH_ENABLED) : false; }

    set status(p_value) {
        this._status = p_value;
        this._status.visible = false;
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._flags.Set(`enabled`, p_data.Get(mkfData.IDS_EXT.SEARCH_ENABLED));
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

    _OnSearchToggle(){
        if(this.activeSearch){
            if(this._data.running){ this._status.visible = false; }
            else{ this._OnSearchComplete(); }
        }
    }

    _CleanUp() {
        if (this.constructor.__clearBuilderOnRelease) { this._builder.Clear(); }
        super._CleanUp();
    }

}

module.exports = GlyphGroupSearch;
ui.Register(`mkfont-glyph-group-search`, GlyphGroupSearch);