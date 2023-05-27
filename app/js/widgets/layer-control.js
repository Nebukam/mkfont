'use strict';

const nkm = require(`@nkmjs/core`);
const u = nkm.u;
const ui = nkm.ui;

const mkfData = require(`../data`);
const mkfOperations = require(`../operations`);
const mkfCmds = mkfOperations.commands;

const LayerTransformSettings = require(`./tr-layer-inspector`);
const GlyphMiniPreview = require(`./glyph-mini-preview`);

const isMANUAL = (owner) => { return owner.data.Get(mkfData.IDS.TR_LYR_SCALE_MODE) == mkfData.ENUMS.LYR_SCALE_MANUAL; };
const isNRM = (owner) => { return owner.data.Get(mkfData.IDS.TR_LYR_SCALE_MODE) == mkfData.ENUMS.LYR_SCALE_NORMALIZE; };

const __circular = `circular`;
const __controlLayer = `control-layer`;
const __false = `false`;

const base = nkm.datacontrols.ControlFoldout;
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
        //this._builder.defaultControlClass = nkm.datacontrols.widgets.ValueControl;

        this.focusArea = this;

    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                //...nkm.style.rules.fadeIn,
                'padding': '5px',
                'margin-bottom': '5px',
                'background-color': `rgba(127,127,127,0.25)`,
            },
            ':host(.circular)': {
                'background-color': `rgba(var(--col-error-low-rgb),0.25)`,
            },
            ':host(:not(.circular).control-layer)': {
                'background-color': `rgba(var(--col-infos-low-rgb),0.25)`,
            },
            ':host(.false) .label': {
                'text-decoration': 'line-through var(--col-error-low)',
            },
            ':host(.false)': {
                'background-color': `rgba(127,127,127,0.1)`
            },
            '.hdr': {
                'margin': '5px 2px 5px 2px'
            },
            '.preview': {
                'width': '22px',
                'height': '22px',
                'border-radius':`3px`,
                'margin-right':`5px`
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

        this._glyphPreview = this.Attach(GlyphMiniPreview, `preview`, this._header);
        ui.dom.AttachBefore(this._glyphPreview, this._label._element);
        this._glyphPreview._svgPlaceholder._element.style.setProperty(`font-size`, `1em`);

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
                /*{
                    icon: `shortcut`, htitle: `Go to glyph`, variant: ui.FLAGS.MINIMAL, size: ui.FLAGS.SIZE_S, trigger: {
                        fn: () => { if (this._data._glyphInfos) { this.editor.inspectedData.Set(this._data._glyphInfos); } },
                        arg: ui.FLAGS.SELF
                    }, member: { owner: this, id: `_shortcutBtn` }
                },*/
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

        this._toolbar.visible = false;        

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

        let char = p_data.Get(mkfData.IDS.LYR_CHARACTER_NAME),
            customID = p_data.Get(mkfData.IDS.LYR_CUSTOM_ID);

        if (customID) { char = `<b>${customID}</b>`; }

        if (p_data._useCount <= 0) { this._label.Set(char && char != `` ? `${char} ` : `<i>(empty)</i>`); }
        else { this._label.Set(char && char != `` ? `${char} (×${p_data._useCount})` : `<i>(empty ×${p_data._useCount})</i>`); }

        this._flags.Set(__circular, p_data.Get(mkfData.IDS.CIRCULAR_REFERENCE));
        let viz = p_data.Get(mkfData.IDS.DO_EXPORT);
        this._btnVisible.currentValue = viz;
        this._flags.Set(__false, !viz);

        //this._shortcutBtn.disabled = !(this._data._glyphInfos != null);
        this._flags.Set(__controlLayer, p_data.Get(mkfData.IDS.LYR_IS_CONTROL_LAYER));

        this._glyphPreview.glyphInfos = p_data._glyphInfos;
        this._glyphPreview.data = p_data.importedVariant;

    }

    _FocusGain() {
        super._FocusGain();
        this._toolbar.visible = true;
        if (this._data) { this._data._variant.selectedLayer = this._data; }
    }

    _FocusLost() {
        super._FocusLost();
        this._toolbar.visible = false;
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