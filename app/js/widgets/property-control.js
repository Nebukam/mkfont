const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;

const mkfData = require(`../data`);

const __flag_inherited = `inherited`;

class PropertyControl extends ui.Widget {
    constructor() { super(); }

    static __usePaintCallback = true;

    _Init() {
        super._Init();
        this._fallbackData = null;
        this._valueID = null;
        this._valueInfos = null;
        this._input = null;

        this._Bind(this._OnValueSubmit);

        this._flags.Add(this, __flag_inherited);

        this._onSubmitFn = null;

    }

    _PostInit() {
        super._PostInit();
        //this.focusArea = this;
    }

    _Style() {
        return nkm.style.Extends({
            ':host': {
                'position': 'relative',
                //'border':'1px solid gray',
                'display': 'flex',
                'flex-flow': 'row nowrap',
                'align-items': 'center',
            },
            ':host(.selected)': {
                'background-color': 'rgba(127,127,127,0.25)'
            },

            ':host(.inherited) .input-field': {
                'pointer-events': 'none !important',
                'opacity': '0.5'
            },

            '.label-area': {
                'display': 'flex',
                'flex-flow': 'row nowrap',
                'align-items': 'center',

                'flex': '1 1 50%'
            },
            '.label': {
                'margin-left': '10px'
            },
            '.label::after': {
                'content': '"🛈"',
                //'position':'absolute',
                'margin-left': '3px',
                //'margin-top':'-3px',
                'font-size': '12px',
                'opacity': '0.5'
            },
            '.input-field': {
                'flex': '1 0 50%'
            }
        }, super._Style());
    }

    _Render() {
        super._Render();
        let labelCtnr = ui.dom.El(`div`, { class: `label-area` }, this._host);
        this._toggle = this.Add(inputs.Boolean, `toggle`, labelCtnr);
        this._toggle.size = nkm.ui.FLAGS.SIZE_XS;
        this._toggle.preventTabIndexing = true;
        this._label = new ui.manipulators.Text(ui.dom.El(`div`, { class: `label` }, labelCtnr), false, false);
    }

    _OnPaintChange() {
        super._OnPaintChange();
        if (this._isPainted) {
            //this.style.opacity = 1;
        } else {
            //this.style.opacity = 0;
        }
    }

    Setup(p_id) {

        this._valueID = p_id;
        this._valueInfos = mkfData.IDS.GetInfos(p_id);

        if (this._input) {
            this._input.Release();
            this._input = null;
        }

        this._label._element.setAttribute(`title`, this._valueInfos.desc);
        this._label.Set(this._valueInfos.label || this._valueID);

        let inputType = null;

        // if info 'overridable' : show toggle.
        // override value = if value is null, not overriden. Otherwise, ok.

        this._input = this.Add(this._valueInfos.inputType, `input-field`);
        this._input.options = {
            size: nkm.ui.FLAGS.SIZE_XS,
            onSubmit: { fn: this._OnValueSubmit },
            ...this._valueInfos.inputOptions
        }

    }

    Set(p_data, p_fallback = null) {
        this._fallbackData = p_fallback;
        this.data = p_data;
    }

    get localValue() {
        if (!this._data) { return null; }
        return this._data.Get(this._valueID);
    }

    get currentValue() {
        if (!this._data) { return null; }
        let localValue = this.localValue;
        if (localValue == null) {
            if (this._fallbackData) {
                return this._fallbackData.Get(this._valueID);
            }
        }
        return localValue;
    }

    _OnValueSubmit(p_input, p_value) {
        if (this._onSubmitFn) { this._onSubmitFn(this._valueID, p_value); }
        else { this._data.Set(this._valueID, p_value); }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        if (this._input) {
            this._input.currentValue = this.currentValue;
        }

        let inherited = false;

        let localValue = this.localValue;
        if (localValue == null) {
            if (this._fallbackData) {
                let inherited = this._fallbackData.Get(this._valueID);
                if (inherited != null) { inherited = true; }
            }
        }

        this._flags.Set(__flag_inherited, inherited);
        this._toggle.currentValue = !inherited;
    }

    _ToClipboard() {
        navigator.clipboard.writeText(this._data._options.glyph);
    }

    _Cleanup() {
        super._Cleanup();
    }

}

module.exports = PropertyControl;
ui.Register(`mkfont-property-control`, PropertyControl);