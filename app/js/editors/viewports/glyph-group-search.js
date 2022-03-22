const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const mkfData = require(`../../data`);
const mkfWidgets = require(`../../widgets`);
const mkfInspectors = require(`../inspectors`);

console.log(mkfWidgets);

class GlyphGroupSearch extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    static __controls = [
        { cl: mkfWidgets.ControlHeader, options: { label: `Boundaries` }, css: 'header' },
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

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                '@': ['fade-in'],
                'display': 'flex',
                'flex-flow': 'row wrap',
                //'min-height': '0',
                //'overflow': 'auto',
                //'padding': '10px',
                'align-content': 'flex-start',
            },
            '.control': {
                'flex': '1 1 auto',
                'margin': '0 2px 5px 2px'
            },
            '.small': {
                'flex': '1 1 45%'
            },
            '.header': {
                'margin': '5px 2px 5px 2px'
            }
        }, super._Style());
    }

    set displayRange(p_value) {
        this._displayRange = p_value;
        this._subTags.Clear();
        if (p_value) {
            if (p_value.parent) {
                this._title.Set(`${p_value.parent.name} : ${p_value.name}`);
                this._typeTag.label = p_value.typeTag || `Mixed blocks`;
                //this._typeTag.bgColor = `var(--col-${p_value.col || `default`})`;
            } else {
                this._title.Set(p_value.name);
                if (p_value.typeTag) {
                    this._typeTag.label = p_value.typeTag;
                } else {
                    let r = `U+${p_value.start.toString(16).padStart(4, `0`)} .. U+${(p_value.start + p_value.count).toString(16).padStart(4, `0`)}`;
                    //this._typeTag.label = `Unicode block ${r}`;
                    this._typeTag.label = `${r}`;
                }
            }
            this._countTag.label = `<b>${u.isFunc(p_value.count) ? p_value.count(this._data) : p_value.count}</b> Glyphs`;
        } else {
            this._title.Set(`---`);
        }
    }

    _CleanUp() {
        if (this.constructor.__clearBuilderOnRelease) { this._builder.Clear(); }
        super._CleanUp();
    }

}

module.exports = GlyphGroupSearch;
ui.Register(`mkfont-glyph-group-search`, GlyphGroupSearch);