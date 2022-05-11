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
const __controlLayer = `control-layer`;
const __false = `false`;

const base = nkm.datacontrols.InspectorWidgetGroup;
class LayerControl extends base {
    constructor() { super(); }

    //static __widgetExpandData = false;
    //static __clearBuilderOnRelease = false;

    static __controls = [
        { cl: LayerTransformSettings, options: {} }
    ];

    _Init() {
        super._Init();

        this._flags.Add(this, __circular, __false, __controlLayer);

        this._builder.defaultControlClass = PropertyControl;
        this._builder.defaultCSS = `control`;

        this.focusArea = this;

    }

    _PostInit() {
        super._PostInit();
        this._builder.host = this._body;
        this._extExpand.Setup(this, this._body, this._expandIcon.element);
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                //'@': [`fade-in`],
                'padding': '5px',
                'margin-bottom': '5px',
                'background-color': `rgba(127,127,127,0.25)`,
            },
            ':host(.circular)': {
                'background-color': `rgba(var(--col-error-dark-rgb),0.25)`,
            },
            ':host(:not(.circular).control-layer)':{
                'background-color': `rgba(var(--col-infos-dark-rgb),0.25)`,
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

    get isFirstLayer() { return this._isFirstLayer; }
    set isFirstLayer(p_value) {
        this._isFirstLayer = p_value;
        this._moveDownBtn.disabled = p_value;
    }

    get isLastLayer() { return this._isLastLayer; }
    set isLastLayer(p_value) {
        this._isLastLayer = p_value;
        this._moveUpBtn.disabled = p_value;
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
                    //variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this._MoveLayerUp(); } },
                    group: `move`, member: { owner: this, id: `_moveUpBtn` }
                },
                {
                    icon: `down-short`, htitle: `Move layer down`,
                    //variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this._MoveLayerDown(); } },
                    group: `move`, member: { owner: this, id: `_moveDownBtn` }
                },
                {
                    icon: `shortcut`, htitle: `Go to glyph`, variant: ui.FLAGS.MINIMAL, size: ui.FLAGS.SIZE_S, trigger: {
                        fn: () => { if (this._data._glyphInfos) { this.editor.inspectedData.Set(this._data._glyphInfos); } },
                        arg: ui.FLAGS.SELF
                    }, member: { owner: this, id: `_shortcutBtn` }
                },
                {
                    htitle: `Toggle visibility`,
                    cl: nkm.uilib.inputs.Checkbox,
                    iconOn: `visible`, iconOff: `hidden`,
                    onSubmit: { fn: this._ToggleVisibility, thisArg: this },
                    member: { owner: this, id: `_btnVisible` },
                    group: `vis`,
                },
                {
                    icon: `remove`, htitle: `Delete  this layer`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: this._DeleteLayer, thisArg: this },
                    group: `remove`
                },
            ]
        };

        this._label.ellipsis = true;

    }

    _ToggleVisibility(p_input, p_value) {
        this.editor.Do(mkfOperations.actions.SetProperty, {
            target: this._data,
            id: mkfData.IDS.DO_EXPORT,
            value: p_value
        });
    }

    _DeleteLayer() { this.editor.cmdLayerRemove.Execute(this._data); }

    _MoveLayerUp() { this.editor.cmdLayerUp.Execute(this._data); }

    _MoveLayerDown() { this.editor.cmdLayerDown.Execute(this._data); }

    _OnDataUpdated(p_data) {

        super._OnDataUpdated(p_data);

        let char = p_data.Get(mkfData.IDS.LYR_CHARACTER_NAME);
        if (p_data._useCount <= 0) { this._label.Set(char && char != `` ? `${char} ` : `(empty component)`); }
        else { this._label.Set(char && char != `` ? `${char} (×${p_data._useCount})` : `(empty component ×${p_data._useCount})`); }

        this._flags.Set(__circular, p_data.Get(mkfData.IDS.CIRCULAR_REFERENCE));
        let viz = p_data.Get(mkfData.IDS.DO_EXPORT);
        this._btnVisible.currentValue = viz;
        this._flags.Set(__false, !viz);

        this._shortcutBtn.disabled = !(this._data._glyphInfos != null);
        this._flags.Set(__controlLayer, p_data.Get(mkfData.IDS.LYR_IS_CONTROL_LAYER));

    }

    _FocusGain() {
        super._FocusGain();
        if (this._data) { this._data._variant.selectedLayer = this._data; }
    }

    _FocusLost() {
        super._FocusLost();
        if (this._data && this._data._variant.selectedLayer == this._data) { this._data._variant.selectedLayer = null; }
    }

    _CleanUp() {
        this._flags.Set(__circular, false);
        this._flags.Set(__controlLayer, false);
        super._CleanUp();
    }

}

module.exports = LayerControl;
ui.Register(`mkf-layer-control`, LayerControl);