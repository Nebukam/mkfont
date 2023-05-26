'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const svgpath = require('svgpath');

const UNICODE = require(`../unicode`);
const mkfData = require(`../data`);
const mkfInspectors = require(`./inspectors`);
const mkfWidgets = require(`../widgets`);

const base = nkm.datacontrols.Editor;
class EditorMKFontImport extends base {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._importList = [];

        nkm.ui.helpers.HostSelStack(this, true, true, {
            add: {
                fn: (p_sel, p_index) => {
                    let widget = this._domStreamer.GetItemAt(p_index);
                    if (widget) { widget.Select(true); }
                    else { p_sel.Add(this._importList[p_index]); }
                }, thisArg: this
            },
            remove: {
                fn: (p_sel, p_index, p_data) => {
                    let widget = this._domStreamer.GetItemAt(p_index);
                    if (widget) { widget.Select(false); }
                    else { p_sel.Remove(this._importList[p_index]); }
                }, thisArg: this
            },
            count: {
                fn: (p_sel) => { return this._importList.length; }, thisArg: this
            },
            index: {
                fn: (p_sel, p_data) => { return this._importList.indexOf(p_data); }, thisArg: this
            },
        });

    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                ...nkm.style.flex.column.nowrap,
                ...nkm.style.flexItem.fill,
                'grid-gap': '10px'
            },
            '.item': {
                ...nkm.style.flexItem.fill,
            },
            '.list': {
                ...nkm.style.rules.pos.rel,
                'width': '800px',
                'min-height': '100px',
                //'padding': '10px',
                'background-color': 'rgba(0,0,0,0.2)',
                'overflow': 'auto',

            },
        }, base._Style());
    }

    _Render() {

        super._Render();

        this._header = ui.El(`div`, { class: `item header` }, this._host);

        this._domStreamer = this.Attach(ui.helpers.DOMStreamer, `item list`);
        this._domStreamer
            .Watch(ui.SIGNAL.ITEM_CLEARED, this._OnItemCleared, this)
            .Watch(ui.SIGNAL.ITEM_REQUESTED, this._OnItemRequested, this);

        this._domStreamer.options = {
            layout: {
                itemWidth: 250,
                itemHeight: 66,
                itemCount: 0,
                gap: 5,
            }
        };

        this._footer = ui.El(`div`, { class: `item footer` }, this._host);
        this._toolbar = this.Attach(ui.WidgetBar, `toolbar`, this._footer);
        this._toolbar.options = {
            defaultWidgetClass: nkm.uilib.buttons.Button,
            size: ui.FLAGS.SIZE_S,
            handles: [
                {
                    htitle: `Add all selected glyphs in font.\nWill create empty glyphs where none exists.`,
                    label: `Select all`,
                    trigger: {
                        fn: () => {
                            this._importList.forEach(item => { item.selected = true; });
                            this._OnImportListUpdated();
                        }
                    },
                },
                {
                    htitle: `Copy current selection as unicodes characters to clipboard.\nEach value is separated by a '\\n' new line.`,
                    label: `Unselect all`,
                    trigger: {
                        fn: () => {
                            this._importList.forEach(item => { item.selected = false; });
                            this._OnImportListUpdated();
                        }
                    },
                },
                {
                    htitle: `Copy current selection as unicodes characters to clipboard.\nEach value is separated by a '\\n' new line.`,
                    label: `Toggle selected glyphs`,
                    trigger: {
                        fn: () => {
                            this._selStack.data.stack.ForEach(item => { item.selected = true; });
                            this._OnImportListUpdated();
                        }
                    },
                }
            ]


        };

    }

    get family() { return this._family; }
    set family(p_value) { this._family = p_value; }

    set importList(p_value) {

        this._importList = p_value;

        if (!p_value) {
            this._domStreamer.itemCount = 0;
            return;
        }

        this._domStreamer.itemCount = this._importList.length;

    }

    _OnImportListUpdated() {
        this._domStreamer._items.forEach((item) => { item.Update(); });
    }

    _OnItemCleared() { }

    _OnItemRequested(p_streamer, p_index, p_fragment, p_returnFn) {

        console.log(`_OnItemRequested`);

        let
            data = this._importList[p_index],
            newItem = this.Attach(mkfWidgets.importation.ImportMKFontItem, `item`, p_fragment);

        newItem.editor = this;
        newItem.data = data;

        p_returnFn(p_index, newItem);

    }

    _CleanUp() {
        this.importList = null;
        super._CleanUp();
    }

}

module.exports = EditorMKFontImport;
ui.Register(`mkf-mkfont-import-editor`, EditorMKFontImport);