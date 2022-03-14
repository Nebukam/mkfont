const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const mkfData = require(`../../data`);
const mkfInspectors = require(`../inspectors`);

class GlyphGroupHeader extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    _Init() {
        super._Init();

        this._displayRange = null;

        let fn = () => { return { editor: this.editor, data: this._data }; };
        let margins = { x: 0, y: 5 };

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'min-height': 'auto',
                'padding': '20px',
                'overflow': 'clip'
            },
            '.title': {
                'margin-bottom': '10px'
            },
            '.toolbar': {

            }
        }, super._Style());
    }

    _Render() {

        super._Render();

        this._title = new ui.manipulators.Text(ui.dom.El("div", { class: "title font-medium" }, this));
        this._title.Set("---");

        this._tagBar = this.Add(ui.WidgetBar, `tagbar left`);
        this._tagBar.options = {
            defaultWidgetClass: nkm.uilib.widgets.Tag,
            size: ui.FLAGS.SIZE_XS
        };


        this._typeTag = this._tagBar.CreateHandle();
        this._typeTag.bgColor = `black`;

        this._countTag = this._tagBar.CreateHandle();

        this._subTags = this._tagBar.CreateHandle({ cl: ui.WidgetBar, group: `categories` });
        this._subTags._defaultWidgetClass = nkm.uilib.widgets.Tag;

    }

    _OnEditorChanged(p_oldEditor) {
        this._displayInspector.editor = this._editor;
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        //this._title.Set(p_data.Resolve(mkfData.IDS.FAMILY));
    }

    set displayRange(p_value) {
        this._displayRange = p_value;
        this._subTags.Clear();
        if (p_value) {
            if (p_value.parent) {
                this._title.Set(`${p_value.parent.name} : ${p_value.name}`);
                this._typeTag.label = `Mixed blocks`;
                //this._typeTag.bgColor = `var(--col-${p_value.col || `default`})`;
            } else {
                this._title.Set(p_value.name);
                this._typeTag.label = `Unicode block`;
                /*
                for(let i = 0; i < p_value.cats.length; i++){
                    let cat = p_value.cats[i];
                    this._subTags.CreateHandle({ label:cat.id, bgColor:`black` });
                }
                */
                //this._typeTag.bgColor = `var(--col-default)`;
            }
            this._countTag.label = `<b>${p_value.count}</b> Glyphs`;
        } else {
            this._title.Set(`---`);
        }
    }

}

module.exports = GlyphGroupHeader;
ui.Register(`mkfont-glyph-group-header`, GlyphGroupHeader);