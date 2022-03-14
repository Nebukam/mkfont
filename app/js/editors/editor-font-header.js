const nkm = require(`@nkmjs/core`);
const u = nkm.utils;
const ui = nkm.ui;

const mkfData = require(`../data`);
const mkfInspectors = require(`./inspectors`);

class FontEditorHeader extends nkm.datacontrols.ControlView {
    constructor() { super(); }

    _Init() {
        super._Init();

        let fn = () => { return { editor: this.editor, data: this._data }; };
        let margins = { x: 0, y: 5 };

        this._displayInspector = ui.UI.Rent(mkfInspectors.Display);
        this._modalDisplayOpts = this._commands.Create(ui.commands.Modal, 'Display', 'gear');
        this._modalDisplayOpts.options = {
            modalClass: nkm.uilib.modals.Simple,
            content: this._displayInspector,
            anchorToEmitter: true, margins: margins,
            placement: ui.ANCHORING.BOTTOM_LEFT,
            contentOptionsGetter: { fn: fn, thisArg: this }
        };

        this._modalFamilyOpts = this._commands.Create(ui.commands.Modal, 'Infos', 'font');
        this._modalFamilyOpts.options = {
            modalClass: nkm.uilib.modals.Simple,
            content: mkfInspectors.Family,
            anchorToEmitter: true, margins: margins,
            placement: ui.ANCHORING.BOTTOM_LEFT,
            contentOptionsGetter: { fn: fn, thisArg: this }
        };

        this._modalSubFamilyOpts = this._commands.Create(ui.commands.Modal, 'Metrics', 'layout');
        this._modalSubFamilyOpts.options = {
            modalClass: nkm.uilib.modals.Simple,
            content: mkfInspectors.SubFamily,
            anchorToEmitter: true, margins: margins,
            placement: ui.ANCHORING.BOTTOM_LEFT,
            contentOptionsGetter: { fn: fn, thisArg: this }
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
                'opacity': '0.2'
            },
            '.toolbar': {

            }
        }, super._Style());
    }

    _Render() {

        super._Render();

        this._toolbarLeft = this.Add(ui.WidgetBar, `toolbar left`);
        this._toolbarLeft.options = {
            inline: true,
            defaultWidgetClass: nkm.uilib.buttons.Button,
            handles: [
                {
                    label: `Save`, icon: `save`,
                    size: ui.FLAGS.SIZE_S,
                    flavor: ui.FLAGS.CTA,// variant:ui.FLAGS.FRAME,
                    group: `file-actions`
                },
                {
                    label: `Export`, icon: `download`,
                    size: ui.FLAGS.SIZE_S,
                    flavor: ui.FLAGS.CTA, variant: ui.FLAGS.FRAME,
                    group: `file-actions`
                },
                {
                    command: this._modalDisplayOpts,
                    size: ui.FLAGS.SIZE_S,
                    cl: nkm.uilib.buttons.Tool,
                    group: `family`
                },
                {
                    command: this._modalFamilyOpts,
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
                    size: ui.FLAGS.SIZE_S,
                    group: `family`
                },
                {
                    label: `Load`, icon: `directory-download`,
                    size: ui.FLAGS.SIZE_S,
                    group: `external`
                }
            ]
        };

        this._btnSelectSubFamily.visible = false;
        this.forwardData.To(this._btnSelectSubFamily, { dataMember: `_subFamiliesCatalog` });

        this._title = new ui.manipulators.Text(ui.dom.El("div", { class: "title font-large" }, this));
        this._title.Set("---");

    }

    _OnEditorChanged(p_oldEditor) {
        this._displayInspector.editor = this._editor;
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        this._title.Set(p_data.Resolve(mkfData.IDS.FAMILY));
    }

}

module.exports = FontEditorHeader;
ui.Register(`mkfont-font-editor-header`, FontEditorHeader);