'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const mkfData = require(`../../data`);
const mkfInspectors = require(`../inspectors`);
const mkfOperations = require(`../../operations`);
const mkfCmds = mkfOperations.commands;

const base = nkm.datacontrols.ControlView;
class GlyphGroupHeader extends base {
    constructor() { super(); }

    _Init() {
        super._Init();

        this._displayRange = null;

        let fn = () => { return { editor: this.editor, data: this._data }; };
        let margins = { x: 0, y: 5 };

    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                'min-height': 'auto',
                'padding': '20px',
                'overflow': 'clip'
            },
            '.title': {
                'margin-bottom': '10px'
            },
            '.bar': {
                'height': `32px`,
            },
            '.toolbar': {
                'display': 'flex',
                'flex-flow': 'row wrap',
                'justify-content': 'space-between'
            }
        }, base._Style());
    }

    _Render() {

        super._Render();

        this._title = new ui.manipulators.Text(ui.dom.El("div", { class: "title font-medium" }, this));
        this._title.Set("---");

        let toolbar = ui.El(`div`, { class: `toolbar` }, this._host);

        this._tagBar = this.Attach(ui.WidgetBar, `bar tagbar left`, toolbar);
        this._tagBar.options = {
            defaultWidgetClass: nkm.uilib.widgets.Tag,
            size: ui.FLAGS.SIZE_XS
        };

        this._optionsBar = this.Attach(ui.WidgetBar, `bar right`, toolbar);
        this._optionsBar.options = {
            defaultWidgetClass: nkm.uilib.buttons.Tool,
            size: ui.FLAGS.SIZE_S,
            handles: [
                {
                    icon: `new`, htitle: `Add all selected glyphs in font.\nWill create empty glyphs where none exists.\n---\n+ [ Shift ] Applied to viewport content instead of selection.`,
                    trigger: { fn: () => { this.editor.cmdListImportMissing.Execute(this.cmdContent); } },
                    group: `new`
                },
                {
                    icon: `text-unicode-char`, htitle: `Copy current selection as unicodes characters to clipboard. Each value is separated by a '\\n' new line.\n---\n+ [ Shift ] Use viewport content instead of selection.`,
                    trigger: { fn: () => { this.editor.cmdListExportUni.Execute(this.cmdContent); } },
                    group: `export`
                },
                {
                    icon: `text-unicode`, htitle: `Copy current selection as hex values to clipboard.\nEach value is separated by a '\\n' new line.\n---\n+ [ Shift ] Use viewport content instead of selection.`,
                    trigger: { fn: () => { this.editor.cmdListExportUniHex.Execute(this.cmdContent); } },
                    group: `export`
                },
                {
                    icon: `app-illustrator`, htitle: `Create a new Adobe© Illustrator template document with the active selection.\n---\n+ [ Shift ] Uses all viewport content instead of selection.`,
                    trigger: { fn: () => { this.editor.cmdListExportArtboardTemplate.Execute(this.cmdContent); } },
                    group: `export`
                },
                {
                    icon: `remove`, htitle: `Delete all selected glyphs.\n---s\n+ [ Shift ] Delete all viewport content instead of selection.`,
                    trigger: { fn: () => { this.editor.cmdGlyphDelete.Execute(this.cmdContent); } },
                    group: `remove`
                }
            ]


        };

        this._typeTag = this._tagBar.CreateHandle();
        this._typeTag.bgColor = `black`;

        this._countTag = this._tagBar.CreateHandle();

        this._subTags = this._tagBar.CreateHandle({ cl: ui.WidgetBar, group: `categories` });
        this._subTags._defaultWidgetClass = nkm.uilib.widgets.Tag;

    }

    get cmdContent() { return ui.INPUT.shiftKey ? this._parent._content : null; }

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
                this._typeTag.label = p_value.typeTag || `Mixed blocks`;
                //this._typeTag.bgColor = `var(--col-${p_value.col || `default`})`;
            } else {
                this._title.Set(p_value.name);
                if (p_value.typeTag) {
                    this._typeTag.label = p_value.typeTag;
                } else {
                    let r = `U+${p_value.start.toString(16).padStart(4, `0`)} ·· U+${(p_value.start + p_value.count).toString(16).padStart(4, `0`)}`;
                    //this._typeTag.label = `Unicode block ${r}`;
                    this._typeTag.label = `${r}`;
                }

                /*
                for(let i = 0; i < p_value.cats.length; i++){
                    let cat = p_value.cats[i];
                    this._subTags.CreateHandle({ label:cat.id, bgColor:`black` });
                }
                */
                //this._typeTag.bgColor = `var(--col-default)`;
            }
            this._countTag.label = `<b>${u.isFunc(p_value.count) ? p_value.count(this._data) : p_value.count}</b> Glyphs`;
        } else {
            this._title.Set(`---`);
        }
    }

}

module.exports = GlyphGroupHeader;
ui.Register(`mkf-glyph-group-header`, GlyphGroupHeader);