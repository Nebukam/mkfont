const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const mkfData = require(`../../data`);
const mkfInspectors = require(`../inspectors`);
const mkfOperations = require(`../../operations`);
const mkfCmds = mkfOperations.commands;

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
                'display': 'flex',
                'flex-flow': 'row nowrap',
                'justify-content': 'space-between'
            }
        }, super._Style());
    }

    _Render() {

        super._Render();

        this._title = new ui.manipulators.Text(ui.dom.El("div", { class: "title font-medium" }, this));
        this._title.Set("---");

        let toolbar = ui.El(`div`, { class: `toolbar` }, this._host);

        this._tagBar = this.Attach(ui.WidgetBar, `tagbar left`, toolbar);
        this._tagBar.options = {
            defaultWidgetClass: nkm.uilib.widgets.Tag,
            size: ui.FLAGS.SIZE_XS
        };

        this._optionsBar = this.Attach(ui.WidgetBar, `right`, toolbar);
        this._optionsBar.options = {
            defaultWidgetClass: nkm.uilib.buttons.Tool,
            size: ui.FLAGS.SIZE_S,
            handles: [                
                {
                    icon: `new`, htitle: `Add all characters in font (will create empty glyphs)`,
                    trigger: {
                        fn: () => {
                            mkfCmds.ImportViewportEmpty.emitter = this;
                            mkfCmds.ImportViewportEmpty.Execute(this._parent._content);
                        },
                        thisArg: this
                    }
                },
                {
                    icon: `text-unicode-char`, htitle: `Copy current unicodes characters to clipboard.\nEach value is separated by a '\\n' new line.`,
                    trigger: {
                        fn: () => {
                            mkfCmds.ExportUniClipboard.emitter = this;
                            mkfCmds.ExportUniClipboard.Execute(this._parent._content);
                        },
                        thisArg: this
                    }
                },
                {
                    icon: `text-unicode`, htitle: `Copy current hex values to clipboard.\nEach value is separated by a '\\n' new line.`,
                    trigger: {
                        fn: () => {
                            mkfCmds.ExportUniHexToClipboard.emitter = this;
                            mkfCmds.ExportUniHexToClipboard.Execute(this._parent._content);
                        },
                        thisArg: this
                    }
                },
            ]
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
ui.Register(`mkfont-glyph-group-header`, GlyphGroupHeader);