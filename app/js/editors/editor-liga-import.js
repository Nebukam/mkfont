'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const MiniHeader = nkm.datacontrols.widgets.MiniHeader;

const svgpath = require('svgpath');

const UNICODE = require(`../unicode`);
const mkfData = require(`../data`);
const mkfInspectors = require(`./inspectors`);
const mkfWidgets = require(`../widgets`);

const isNEWLINE = (owner) => { return owner.data ? !owner.data.Get(mkfData.IDS_EXT.LIGA_EACH_LINE) : true; };

const base = nkm.datacontrols.Editor;
class EditorLigaImport extends base {
    constructor() { super(); }

    _Init() {
        super._Init();

        this._builder = new nkm.datacontrols.helpers.ControlBuilder(this);
        this._builder.options = { cl:nkm.datacontrols.widgets.ValueControl, css:`control` };
        
        this.forwardData.To(this._builder);

        this._dataPreProcessor = (p_owner, p_data) => {
            if (nkm.u.isInstanceOf(p_data, mkfData.Glyph)) { return p_data.family._ligaSettings; }
            if (nkm.u.isInstanceOf(p_data, mkfData.GlyphVariant)) { return p_data.glyph.family._ligaSettings; }
            if (nkm.u.isInstanceOf(p_data, mkfData.Family)) { return p_data._ligaSettings; }
            return p_data;
        };

        this._btnList = [];
        this._ligaMap = {};
        this._cached = new Set();

        this._delayedPrintResult = nkm.com.DelayedCall(this._Bind(this._PrintNextResults));

    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'grid',
                'flex-flow': 'column wrap',
                ...nkm.style.flexItem.fixed,
                'grid-template-columns': 'max-content max-content',
                'grid-template-rows': '400px',
                'grid-gap': '10px'
            },
            '.list': {
                ...nkm.style.flex.rows,
                'width': '500px',
                //'padding': '10px',
                'overflow': 'auto',
                'align-content': 'flex-start'
            },
            '.inputs': {
                ...nkm.style.flex.column,
                ...nkm.style.rules.gap.small,
                ...nkm.style.flexItem.fill,
                'width': '300px'
            },
            '.control': {
                //'margin-bottom': '5px'
            },
            '.liga': {
                'margin': `4px`
            },
            '.msg': {
                ...nkm.style.rules.absolute.center,
            }
        }, base._Style());
    }

    _Render() {

        super._Render();

        this._inputs = ui.dom.El(`div`, { class: `inputs` }, this._host);
        this._builder.Build([
            { cl: MiniHeader, options: { label: `Text` } },
            { options: { propertyId: mkfData.IDS_EXT.LIGA_TEXT, inputOnly: true }, member: `_textBox` },
            { options: { propertyId: mkfData.IDS_EXT.LIGA_EACH_LINE } },
            { cl: MiniHeader, options: { label: `Limits (first 500 results)` } },
            { options: { propertyId: mkfData.IDS_EXT.LIGA_MIN }, disableWhen: { fn: isNEWLINE } },
            { options: { propertyId: mkfData.IDS_EXT.LIGA_MAX }, disableWhen: { fn: isNEWLINE } },
            { options: { propertyId: mkfData.IDS_EXT.LIGA_MIN_OCCURENCE }, disableWhen: { fn: isNEWLINE } },
        ], this._inputs);

        this._list = ui.El(`div`, { class: `list` }, this);

        this._msgLabel = new ui.manipulators.Text(ui.dom.El(`div`, { class: `msg label` }, this._list));
        this._msgLabel.Set(``);

    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        this._cached.clear();
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);

        if (p_data.Get(mkfData.IDS_EXT.LIGA_EACH_LINE)) {
            this._textBox.placeholderValue = `One ligature per new line.`;
        } else {
            this._textBox.placeholderValue = `Add some text here to find common character associations.`;
        }

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

        // Simple version

        if (this._data.Get(mkfData.IDS_EXT.LIGA_EACH_LINE)) {

            let
                results = [],
                input = this._data.Get(mkfData.IDS_EXT.LIGA_TEXT);

            try {
                input = input.match(/[^\r\n]+/g);
                input = [...new Set(input)].sort();
                for (let i = 0; i < input.length; i++) {
                    let liga = input[i];
                    if (liga.length <= 1) { continue; }
                    results.push({ export: (this._cached.has(liga) ? true : false), count: 1, ligature: UNICODE.ResolveString(liga) });
                }
            } catch (e) {
                console.log(e);
            }

            if (results.length == 0) {
                this._msgLabel.Set(`Current settings yield no results.`);
            }

            this._OnResultReady(results);

            return;

        }

        // Complex version

        let
            input = this._data.Get(mkfData.IDS_EXT.LIGA_TEXT),
            min = this._data.Get(mkfData.IDS_EXT.LIGA_MIN),
            max = this._data.Get(mkfData.IDS_EXT.LIGA_MAX),
            realMin = Math.min(max, min),
            minOcc = this._data.Get(mkfData.IDS_EXT.LIGA_MIN_OCCURENCE),
            loopCount = Math.max(Math.max(max, min) - realMin, 0) + 1,
            startLength = realMin,
            words = input.split(` `);


        this._ligaMap = {};

        if (input == ``) {
            this._msgLabel.Set(`Add some text to analyze!`);
            return;
        } else {
            this._msgLabel.Set(``);
        }

        // First pass : find all candidates.

        for (let w = 0; w < words.length; w++) {
            try { words.push(...words.split(`\n`)); } catch (e) { }
            try { words.push(...words.split(`\n`)); } catch (e) { }
        }

        for (let w = 0; w < words.length; w++) {
            let word = words[w], cuts = 0;

            cuts += this._PushSplit(words, word, `\n`);
            cuts += this._PushSplit(words, word, `\r`);
            cuts += this._PushSplit(words, word, `\t`);

            word = word.trim();

            if (word == `` || word.length < realMin) {
                cuts++;
            }

            if (cuts > 0) {
                words.splice(w, 1);
                w--;
                continue;
            }

            words[w] = word;
        }

        wordloop: for (let w = 0; w < words.length; w++) {

            let word = words[w];

            substrloop: for (let i = 0; i < loopCount; i++) {

                let len = startLength + i,
                    shifts = word.length - len;

                if (shifts < 0) { continue wordloop; }
                shifts++;

                for (let s = 0; s < shifts; s++) {
                    let segment = word.substr(s, len);

                    if (segment in this._ligaMap) { this._ligaMap[segment].count++; }
                    else { this._ligaMap[segment] = { export: (this._cached.has(segment) ? true : false), count: 1, ligature: segment }; }
                }

            }

        }

        let results = [];

        for (let segment in this._ligaMap) {
            let liga = this._ligaMap[segment];
            if (liga.count < minOcc) { continue; }
            results.push(liga);
        }

        results.sort((a, b) => { return b.count - a.count; });

        if (results.length == 0) {
            this._msgLabel.Set(`Current settings yield no results.`);
        } else if (results.length > 500) {
            results.splice(500, results.length - 500);
        }

        this._OnResultReady(results);

    }

    _PushSplit(p_words, p_word, p_split) {
        let split = p_word.split(p_split);

        if (split.length > 1) {
            p_words.push(...split);
            return 1;
        } else {
            return 0;
        }

    }

    ToggleLiga(p_liga) {
        if (p_liga.export) { this._cached.add(p_liga.ligature); }
        else { this._cached.delete(p_liga.ligature); }

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
    
    _CleanUp() {
        this.catalog = null;
        super._CleanUp();
    }

}

module.exports = EditorLigaImport;
ui.Register(`mkf-liga-import-editor`, EditorLigaImport);