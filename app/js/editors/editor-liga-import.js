const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const svgpath = require('svgpath');

const UNICODE = require(`../unicode`);
const mkfData = require(`../data`);
const mkfInspectors = require(`./inspectors`);
const mkfWidgets = require(`../widgets`);

class EditorLigaImport extends nkm.datacontrols.Editor {
    constructor() { super(); }

    _Init() {
        super._Init();

        this._builder = new nkm.datacontrols.helpers.ControlBuilder(this);
        this._builder._defaultControlClass = mkfWidgets.PropertyControl;
        this._builder.defaultCSS = `control`;

        this.forwardData.To(this._builder);

        this._dataPreProcessor = (p_owner, p_data) => {
            console.log(p_data);
            if (nkm.utils.isInstanceOf(p_data, mkfData.Glyph)) { return p_data.family._ligaSettings; }
            if (nkm.utils.isInstanceOf(p_data, mkfData.GlyphVariant)) { return p_data.glyph.family._ligaSettings; }
            if (nkm.utils.isInstanceOf(p_data, mkfData.SubFamily)) { return p_data.family._ligaSettings; }
            if (nkm.utils.isInstanceOf(p_data, mkfData.Family)) { return p_data._ligaSettings; }
            return p_data;
        };

        this._btnList = [];
        this._ligMap = {};

        this._delayedPrintResult = nkm.com.DelayedCall(this._Bind(this._PrintNextResults));

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'grid',
                'flex-flow': 'column wrap',
                'flex': '0 0 auto',
                'grid-template-columns': 'max-content max-content',
                'grid-template-rows': '400px',
                'grid-gap': '10px'
            },
            '.list': {
                'position': 'relative',
                'width': '500px',
                //'padding': '10px',
                'overflow': 'auto',
                'display': 'flex',
                'flex-flow': 'row wrap',
                'align-content': 'flex-start'
            },
            '.inputs': {
                'width': '300px'
            },
            '.control': {
                'margin-bottom': '5px'
            },
            '.liga': {
                'margin': `4px`
            }
        }, super._Style());
    }

    _Render() {


        this._inputs = ui.dom.El(`div`, { class: `inputs` }, this._host);
        this._builder.host = this._inputs;

        super._Render();

        this._builder.Build([
            { cl: mkfWidgets.ControlHeader, options: { label: `Text` } },
            { options: { propertyId: mkfData.IDS_EXT.LIGA_TEXT, inputOnly: true } },
            { cl: mkfWidgets.ControlHeader, options: { label: `Limits` } },
            { options: { propertyId: mkfData.IDS_EXT.LIGA_MIN } },
            { options: { propertyId: mkfData.IDS_EXT.LIGA_MAX } },
            { options: { propertyId: mkfData.IDS_EXT.LIGA_MIN_OCCURENCE } },
        ]);

        this._list = ui.El(`div`, { class: `list` }, this);

    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._ComputeCandidates();
    }

    _ClearBtns() {
        for (let i = 0; i < this._btnList.length; i++) {
            this._btnList[i].Release();
        }
    }

    _AddLiga(p_liga) {
        let btn = this.Attach(mkfWidgets.LigaButton, `liga`, this._list);
        btn.SetLiga(p_liga);
        this._btnList.push(btn);
    }

    _ComputeCandidates() {

        this._ClearBtns();

        let
            input = this._data.Get(mkfData.IDS_EXT.LIGA_TEXT),
            min = this._data.Get(mkfData.IDS_EXT.LIGA_MIN),
            max = this._data.Get(mkfData.IDS_EXT.LIGA_MAX),
            minOcc = this._data.Get(mkfData.IDS_EXT.LIGA_MIN_OCCURENCE),
            loopCount = Math.max(Math.max(max, min) - Math.min(max, min), 0)+1,
            startLength = Math.min(min, max),
            words = input.split(` `);

        this._ligMap = {};

        // First pass : find all candidates.

        for (let w = 0; w < words.length; w++) {
            let word = words[w];
            word = word.split(`\n`).join(``);
            word = word.split(`\r`).join(``);
            word = word.split(`\t`).join(``);
            word = word.trim();
            if (word == ``) { words.splice(w, 1); w--; }
            words[w] = word;
        }

        wordloop: for (let w = 0; w < words.length; w++) {
            let word = words[w];
            substrloop: for (let i = 0; i < loopCount; i++) {
                let len = startLength + i,
                    shifts = word.length - len;
                if (shifts <= 0) { continue wordloop; }
                for (let s = 0; s < shifts; s++) {
                    let segment = word.substr(s, len);
                    if (segment in this._ligMap) { this._ligMap[segment].count++; }
                    else { this._ligMap[segment] = { export: false, count: 0, ligature: segment }; }
                }
            }
        }

        let results = [];

        for (let segment in this._ligMap) {
            let liga = this._ligMap[segment];
            if (liga.count < minOcc) { continue; }
            results.push(liga);
        }

        results.sort((a, b) => { return b.count - a.count; });
        this._OnResultReady(results);

    }


    _OnResultReady(p_results) {
        this._delayedPrintResult.Cancel();
        this._results = p_results;
        this._covered = 0;
        this._PrintNextResults();
    }

    _PrintNextResults() {
        let len = this._results.length - this._covered;
        if (len <= 0) { return; }
        len = Math.min(len, 5);
        for (let i = 0; i < len; i++) {
            this._AddLiga(this._results[this._covered++]);
        }
        this._delayedPrintResult.Schedule();
    }


    _GetUnicodeStructure(p_array) {

        if (p_array.length == 1) {
            return this._SingleStructure(p_array[0]);
        }

        let result = [];
        for (let i = 0; i < p_array.length; i++) {
            result.push(...this._SingleStructure(p_array[i]));
        }


        return result;

    }

    _SingleStructure(p_value) {
        if (p_value.length == 1) { return [UNICODE.GetAddress(p_value)]; }
        if (p_value.substr(0, 2) == `U+`) { return [p_value.substring(2)]; }

        let result = [];
        for (let i = 0; i < p_value.length; i++) { result.push(UNICODE.GetAddress(p_value.substr(i, 1))); }
        return result;
    }

    _CleanUp() {
        this.catalog = null;
        super._CleanUp();
    }

}

module.exports = EditorLigaImport;
ui.Register(`mkfont-liga-import-editor`, EditorLigaImport);