'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const mkfData = require(`../data`);
const mkfOperations = require(`../operations`);
const mkfCmds = mkfOperations.commands;

const PropertyControl = require(`./property-control`);
const LayerTransformSettings = require(`./tr-layer-inspector`);

const isMANUAL = (owner) => { return owner.data.Get(mkfData.IDS.TR_LYR_SCALE_MODE) == mkfData.ENUMS.LYR_SCALE_MANUAL; };
const isNRM = (owner) => { return owner.data.Get(mkfData.IDS.TR_LYR_SCALE_MODE) == mkfData.ENUMS.LYR_SCALE_NORMALIZE; };

const __circular = `circular`;
const __false = `false`;

const base = nkm.datacontrols.InspectorWidgetGroup;
class LayerControl extends base {
    constructor() { super(); }

    static __widgetExpandData = false;

    static __controls = [
        { cl: LayerTransformSettings, options: {} }
    ];

    _Init() {
        super._Init();

        this._flags.Add(this, __circular, __false);

        this._builder.defaultControlClass = PropertyControl;
        this._builder.defaultCSS = `control`;

        this.forwardData.Remove(this._builder);
        this.forwardData.To(this._builder, { dataMember: `_transformSettings` });

    }

    _PostInit() {
        super._PostInit();
        this._builder.host = this._body;
        this._extExpand.Setup(this, this._body, this._expandIcon.element);
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                'padding': '5px',
                'margin-bottom': '5px',
                'background-color': `rgba(127,127,127,0.25)`,
            },
            ':host(.circular)': {
                'background-color': `rgba(var(--col-error-dark-rgb),0.25)`,
            },
            ':host(.false) .label': {
                'text-decoration': 'line-through var(--col-error-dark)',
            },
            '.body': {
                'display': 'flex',
                'width': `100%`,
                'flex-flow': 'row wrap',
                'align-content': 'flex-start',
            },
            '.control': {
                'flex': '1 1 100%',
                'margin': '0 2px 5px 2px',
                'min-height': 0
            },
            '.hdr': {
                'margin': '5px 2px 5px 2px'
            },
            '.small': {
                'flex': '1 1 45%'
            },
        }, base._Style());
    }

    _Render() {

        super._Render();

        this._toolbar.options = {
            inline: true,
            size: nkm.ui.FLAGS.SIZE_XS,
            defaultWidgetClass: nkm.uilib.buttons.Tool,
            handles: [
                {
                    icon: `up-short`, htitle: `Move layer up`,
                    variant: ui.FLAGS.MINIMAL,
                    //trigger: { fn: () => { this.editor.cmdLayerAdd.Execute(this._data); } },
                    group: `move`
                },
                {
                    icon: `down-short`, htitle: `Move layer down`,
                    variant: ui.FLAGS.MINIMAL,
                    //trigger: { fn: () => { this.editor.cmdLayersOn.Execute(this._data); } },
                    group: `move`
                },
                {
                    htitle: `Toggle visibility`,
                    cl: nkm.uilib.inputs.Checkbox,
                    iconOn: `visible`, iconOff: `hidden`,
                    onSubmit: {
                        fn: (p_input, p_value) => {
                            this.editor.Do(mkfOperations.actions.SetProperty, {
                                target: this._data,
                                id: mkfData.IDS.EXPORT_GLYPH,
                                value: p_value
                            });
                        }
                    },
                    member: { owner: this, id: `_btnVisible` },
                    group: `vis`,
                },
                {
                    icon: `remove`, htitle: `Delete  this layer`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdLayerRemove.Execute(this._data); } },
                    group: `remove`
                },
            ]
        };

    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        let char = p_data.Get(mkfData.IDS.CHARACTER_NAME);
        this._label.Set(char && char != `` ? `layer : ${char} ` : `(empty layer)`);
        this._flags.Set(__circular, p_data.Get(mkfData.IDS.CIRCULAR_REFERENCE));
        let viz = p_data.Get(mkfData.IDS.EXPORT_GLYPH);
        this._btnVisible.currentValue = viz;
        this._flags.Set(__false, !viz);
    }

    _CleanUp() {
        this._flags.Set(__circular, false);
        super._CleanUp();
    }

}

module.exports = LayerControl;
ui.Register(`mkf-layer-control`, LayerControl);