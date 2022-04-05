const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const mkfData = require(`../data`);
const mkfInspectors = require(`./inspectors`);
const mkfOperations = require(`../operations`);
const mkfCmds = mkfOperations.commands;

class FontEditorHeader extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    _Init() {
        super._Init();

        let fn = () => { return { editor: this.editor, data: this._data }; };
        let margins = { x: 0, y: 5 };

        this._displayInspector = ui.UI.Rent(mkfInspectors.Display);
        this._modalDisplayOpts = this._commands.Create(ui.commands.Modal, 'Display', 'gear');
        this._modalDisplayOpts.options = {
            content: this._displayInspector,
            anchorToEmitter: true, margins: margins,
            placement: ui.ANCHORING.BOTTOM_LEFT,
            contentOptionsGetter: { fn: fn, thisArg: this }
        };

        this._modalFamilyOpts = this._commands.Create(ui.commands.Modal, 'Infos', 'font');
        this._modalFamilyOpts.options = {
            content: mkfInspectors.Family,
            anchorToEmitter: true, margins: margins,
            placement: ui.ANCHORING.BOTTOM_LEFT,
            contentOptionsGetter: { fn: fn, thisArg: this }
        };

        this._modalSubFamilyOpts = this._commands.Create(ui.commands.Modal, 'Metrics', 'layout');
        this._modalSubFamilyOpts.options = {
            content: mkfInspectors.SubFamily,
            anchorToEmitter: true, margins: margins,
            placement: ui.ANCHORING.BOTTOM_LEFT,
            contentOptionsGetter: { fn: fn, thisArg: this }
        };

        this._menuHah = this._commands.Create(ui.commands.Menu, 'Menu test', 'layout');
        this._menuHah.options = {
            anchorToEmitter: true,
            items: [
                { name: `item 1` },
                { name: `item 2` },
                { separator: true },
            ]
            //placement: ui.ANCHORING.BOTTOM_LEFT,
            //contentOptionsGetter: { fn: fn, thisArg: this }
        };

    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'display': 'flex',
                'flex-flow': 'row nowrap',
                'align-items': 'center',
                'justify-content': 'space-between',

                'min-height': 'auto',
                'padding': '10px',
                'box-shadow': `0px -2px 5px black`,
                'border-bottom': `1px solid #242424`,
                'background-color': 'rgba(127,127,127,0.1)',
            },
            '.title': {
                'opacity': '0.2',
                'pointer-events':'none'
            },
            '.toolbar': {

            }
        }, super._Style());
    }

    _Render() {

        super._Render();

        this._toolbarLeft = this.Attach(ui.WidgetBar, `toolbar left`);
        this._toolbarLeft.options = {
            inline: true,
            defaultWidgetClass: nkm.uilib.buttons.Button,
            handles: [    
                {
                    label: `Save`, icon: `save`, htitle: `Save`,
                    size: ui.FLAGS.SIZE_S, flavor: ui.FLAGS.CTA,// variant:ui.FLAGS.FRAME,
                    trigger: {
                        fn: () => {
                            mkfCmds.SaveFamilyDoc.Execute(this._data);
                        }
                    },
                    group: `file-actions`
                },
                {
                    label: `Export`, icon: `upload`, htitle: `Export as TTF file`,
                    size: ui.FLAGS.SIZE_S, flavor: ui.FLAGS.CTA, variant: ui.FLAGS.FRAME,
                    trigger: {
                        fn: () => {
                            mkfCmds.ExportTTF.emitter = this;
                            mkfCmds.ExportTTF.Execute(this._data);
                        }
                    },
                    group: `file-actions`
                },/*
                {
                    command: this._modalDisplayOpts,
                    htitle: `Viewport options`,
                    size: ui.FLAGS.SIZE_S,
                    cl: nkm.uilib.buttons.Tool,
                    group: `family`
                },*/
                {
                    command: this._modalFamilyOpts,
                    htitle: `Family name, infos & metadata`,
                    size: ui.FLAGS.SIZE_S,
                    group: `family`
                },
                {
                    member: { owner: this, id: `_btnSelectSubFamily` },
                    cl: nkm.uilib.inputs.Select,
                    group: `family`
                },
                {
                    command: this._modalSubFamilyOpts,
                    htitle: `Global metrics (affect all glyphs)`,
                    size: ui.FLAGS.SIZE_S,
                    group: `family`
                },
                /*{
                    command: this._menuHah,
                    icon: `new`,
                    htitle: `Create a new Glyph`,
                    size: ui.FLAGS.SIZE_S, variant: ui.FLAGS.FRAME,
                    flavor: ui.FLAGS.CTA,
                    group: `create`
                },*/
                {
                    label: `Ligatures`, icon: `text-liga`,
                    htitle: `Analyze a text blurb to find and create ligatures`,
                    size: ui.FLAGS.SIZE_S, //variant: ui.FLAGS.FRAME,
                    flavor: nkm.com.FLAGS.LOADING,
                    group: `external`,
                    trigger: {
                        fn: () => {
                            mkfCmds.ImportTextLiga.emitter = this;
                            mkfCmds.ImportTextLiga.Execute(this._data);
                        }
                    },
                },
                {
                    label: `SVGs`, icon: `directory-download-small`,
                    htitle: `Import multiple SVGs`,
                    size: ui.FLAGS.SIZE_S, //variant: ui.FLAGS.FRAME,
                    flavor: nkm.com.FLAGS.LOADING,
                    group: `external`,
                    trigger: {
                        fn: () => {
                            mkfCmds.ImportExternalFileMultiple.emitter = this;
                            mkfCmds.ImportExternalFileMultiple.Execute(this._data);
                        }
                    },
                },
                {
                    label: `TTF`, icon: `directory-download-small`,
                    htitle: `Import a TTF file`,
                    size: ui.FLAGS.SIZE_S, //variant: ui.FLAGS.FRAME, flavor: nkm.com.FLAGS.LOADING,
                    
                    group: `external`,
                    trigger: {
                        fn: () => {
                            mkfCmds.ImportTTF.emitter = this;
                            mkfCmds.ImportTTF.Execute(this._data);
                        }
                    },
                }
            ]
        };

        this._btnSelectSubFamily.visible = false;
        this.forwardData.To(this._btnSelectSubFamily, { dataMember: `_subFamiliesCatalog` });

        this._title = new ui.manipulators.Text(ui.dom.El("div", { class: "title font-large" }, this));
        this._title.ellipsis = true;
        this._title.Set("---");

    }

    _OnEditorChanged(p_oldEditor) {
        this._displayInspector.editor = this._editor;
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._title.Set(`${p_data.Resolve(mkfData.IDS.FAMILY)}-${p_data.selectedSubFamily.Resolve(mkfData.IDS.FONT_STYLE)}`);
    }

}

module.exports = FontEditorHeader;
ui.Register(`mkfont-font-editor-header`, FontEditorHeader);