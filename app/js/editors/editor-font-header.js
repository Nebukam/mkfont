const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const mkfData = require(`../data`);
const mkfInspectors = require(`./inspectors`);
const mkfOperations = require(`../operations`);
const mkfCmds = mkfOperations.commands;

const base = nkm.datacontrols.ControlView;
class FontEditorHeader extends base {
    constructor() { super(); }

    _Init() {
        super._Init();

        let margins = { x: 0, y: 5 };

        this._modalDisplayOpts = this._CmdModal({ name: 'Display', icon: 'gear' },
            { content: mkfInspectors.Display, margins: margins });

        this._modalFamilyOpts = this._CmdModal({ name: 'Infos', icon: 'font' },
            { content: mkfInspectors.Family, margins: margins });

        this._modalSubFamilyOpts = this._CmdModal({ name: 'Metrics', icon: 'layout' },
            { content: mkfInspectors.SubFamily, margins: margins });

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

    static _Style() {
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
                'pointer-events': 'none'
            },
            '.toolbar': {

            }
        }, base._Style());
    }

    _Render() {

        super._Render();

        this._toolbarLeft = this.Attach(ui.WidgetBar, `toolbar left`);
        this._toolbarLeft.options = {
            inline: true,
            //size: ui.FLAGS.SIZE_S,
            defaultWidgetClass: nkm.uilib.buttons.Button,
            handles: [
                {
                    label: `Save`, icon: `save`, htitle: `Save`,
                    flavor: ui.FLAGS.CTA,// variant:ui.FLAGS.FRAME,
                    trigger: { fn: () => { this.editor.cmdSave.Execute(); } },
                    group: `file-actions`
                },
                {
                    label: `Export`, icon: `upload`, htitle: `Export as TTF file`,
                    flavor: ui.FLAGS.CTA, variant: ui.FLAGS.FRAME,
                    trigger: { fn: () => { this.editor.cmdExport.Execute(); } },
                    group: `file-actions`
                },/*
                {
                    command: this._modalDisplayOpts, isCmdEmitter:true,
                    htitle: `Viewport options`,
                    size: ui.FLAGS.SIZE_S,
                    cl: nkm.uilib.buttons.Tool,
                    group: `family`
                },*/
                {
                    command: this._modalFamilyOpts, isCmdEmitter: true,
                    htitle: `Family name, infos & metadata`,
                    group: `family`
                },
                {
                    member: { owner: this, id: `_btnSelectSubFamily` },
                    cl: nkm.uilib.inputs.Select,
                    group: `family`
                },
                {
                    command: this._modalSubFamilyOpts, isCmdEmitter: true,
                    htitle: `Global metrics (affect all glyphs)`,
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
                    flavor: nkm.com.FLAGS.LOADING, //variant: ui.FLAGS.FRAME,
                    trigger: { fn: () => { this.editor.cmdImportLigatures.Execute(); } },
                    group: `external`,
                },
                {
                    label: `SVGs`, icon: `directory-download-small`,
                    htitle: `Import multiple SVGs`,
                    flavor: nkm.com.FLAGS.LOADING, //variant: ui.FLAGS.FRAME,
                    trigger: { fn: () => { this.editor.cmdImportFileList.Execute(); } },
                    group: `external`,
                },
                {
                    label: `TTF`, icon: `directory-download-small`,
                    htitle: `Import a TTF file`,
                    //variant: ui.FLAGS.FRAME, flavor: nkm.com.FLAGS.LOADING,
                    trigger: { fn: () => { this.editor.cmdImportTTF.Execute(); } },
                    group: `external`,
                }
            ]
        };

        this._btnSelectSubFamily.visible = false;
        this.forwardData.To(this._btnSelectSubFamily, { dataMember: `_subFamiliesCatalog` });

        this._title = new ui.manipulators.Text(ui.dom.El("div", { class: "title font-large" }, this));
        this._title.ellipsis = true;
        this._title.Set("---");

    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._title.Set(`${p_data.Resolve(mkfData.IDS.FAMILY)}-${p_data.selectedSubFamily.Resolve(mkfData.IDS.FONT_STYLE)}`);
    }

}

module.exports = FontEditorHeader;
ui.Register(`mkfont-font-editor-header`, FontEditorHeader);