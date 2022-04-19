const nkm = require(`@nkmjs/core`);
const ui = nkm.ui;
const uilib = nkm.uilib;
const inputs = nkm.uilib.inputs;

const mkfData = require(`../data`);
const mkfOperations = require(`../operations`);
const mkfCmds = mkfOperations.commands;

const __flag_inherited = `inherited`;

class PropertyControl extends nkm.datacontrols.ControlWidget {
    constructor() { super(); }

    static __usePaintCallback = true;

    static __ppdata = (p_owner, p_data) => {
        if (!p_data) { return null; }
        if (p_owner._subData) { return p_data[p_owner._subData]; }
        return p_data;
    };

    static __distribute = nkm.datacontrols.ControlWidget.__distribute.Ext()
        .To(`propertyId`)
        .To(`hideOverride`)
        .To(`subData`, null, null)
        .To(`inputOnly`, null, null)
        .To(`onSubmit`, `_onSubmitFn`, null)
        .To(`invertInputOrder`, null, false)
        .To(`command`, null, mkfCmds.SetProperty);

    _Init() {
        super._Init();
        this._fallbackData = null;
        this._valueID = null;
        this._valueInfos = null;
        this._input = null;

        this._Bind(this._OnValueSubmit);

        this._flags.Add(this, __flag_inherited);

        this._onSubmitFn = null;
        this._inherited = false;
        this._inputOnly = false;

        this._dataPreProcessor = this.constructor.__ppdata;
        this._inputOrder = 1;
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
                'flex': '1 1 auto'
            },
            ':host(.selected)': {
                'background-color': 'rgba(127,127,127,0.25)'
            },

            ':host(.inherited) .input-field, :host(.inherited) .label': {
                'pointer-events': 'none !important',
                'opacity': '0.5'
            },

            '.label-area': {
                'display': 'flex',
                'flex-flow': 'row nowrap',
                'align-items': 'center',
                'max-width': '50%',
                'flex': '1 1 50%'
            },
            '.label': {
                //'text-overflow': 'ellipsis',
                'white-space': 'nowrap',
                //'overflow': 'hidden',
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
            },
            '.toggle': {
                //'width': '30px',
                'margin-right': '4px',
                //'margin-left': '-4px'
            }
        }, super._Style());
    }

    _Render() {
        super._Render();
        this._labelCtnr = ui.dom.El(`div`, { class: `label-area` }, this._host);
        this._toggle = this.Attach(inputs.Checkbox, `toggle`, this._labelCtnr);
        this._toggle.options = {
            size: nkm.ui.FLAGS.SIZE_XS,
            preventTabIndexing: true,
            onSubmit: { fn: this._Bind(this._OnToggleSubmit) }
        }
        this._label = new ui.manipulators.Text(ui.dom.El(`span`, { class: `label` }, this._labelCtnr), false, false);
    }

    set subData(p_value) {
        this._subData = p_value;
    }

    set invertInputOrder(p_value) {

        if (p_value) {
            this._labelCtnr.style.order = `1`;
            this._inputOrder = 0;
        } else {
            this._labelCtnr.style.order = `0`;
            this._inputOrder = 1;
        }
        if (this._input) { this._input.order = this._inputOrder; }
    }

    set inputOnly(p_value) {
        this._inputOnly = p_value;
        if (p_value) { this._labelCtnr.style.display = `none`; }
        else { this._labelCtnr.style.removeProperty(`display`); }
    }

    get propertyId() { return this._valueID; }
    set propertyId(p_id) {

        this._valueID = p_id;
        this._valueInfos = mkfData.IDS.GetInfos(p_id) || mkfData.IDS_EXT.GetInfos(p_id) || mkfData.IDS_PREFS.GetInfos(p_id);

        if (this._input) {
            this._input.order = null;
            this._input.Release();
            this._input = null;
        }

        this._label._element.setAttribute(`title`, this._valueInfos.desc);
        this._label.Set(this._valueInfos.label || this._valueID);

        let inputType = null;

        // if info 'overridable' : show toggle.
        // override value = if value is null, not overriden. Otherwise, ok.

        this._input = this.Attach(this._valueInfos.inputType, `input-field`);
        this._input.options = {
            size: nkm.ui.FLAGS.SIZE_S,
            onSubmit: { fn: this._OnValueSubmit },
            ...this._valueInfos.inputOptions
        };

        this._input.setAttribute(`title`, this._valueInfos.desc);

        this._input.order = this._inputOrder;

    }

    set hideOverride(p_value) {
        this._hideOverride = p_value;
        this._toggle.visible = !p_value;
    }

    set allowOverride(p_value) {
        this._allowOverride = p_value;
        this._toggle.visible = p_value;
    }

    get localValueObj() {
        return this._data._values[this._valueID];
    }

    get localValue() {
        if (!this._data) { return null; }
        return this._data.Get(this._valueID);
    }

    get exportedValue() {
        if (!this._data) { return null; }
        return this._data.Resolve(this._valueID);
    }

    set command(p_value) {
        this._cmd = p_value;
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        if (this._data) {
            let dataObj = this.localValueObj;
            this.allowOverride = this._hideOverride ? false : dataObj ? (`override` in dataObj) : false;
        }
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);

        if (this._input) {
            this._input.currentValue = this.exportedValue;
        }

        this._inherited = this._allowOverride ? !this.localValueObj.override : false;

        if (this._allowOverride) {
            this._flags.Set(__flag_inherited, this._inherited);
        }

        this._toggle.currentValue = !this._inherited;

        if (this._inherited) {
            this._input.currentValue = this.exportedValue;
        } else {
            this._input.currentValue = this.localValue;
        }
    }

    _OnValueSubmit(p_input, p_value) {
        if (this._onSubmitFn) {
            this._onSubmitFn(this, this._valueID, p_value);
        } else if (this._cmd) {
            this._cmd.emitter = this;
            this._cmd.inputValue = p_value;
            this._cmd.Execute();
        } else {
            this._data.Set(this._valueID, p_value);
        }
    }

    _OnToggleSubmit(p_input, p_value) {

        let
            valueObj = this.localValueObj,
            manualUpdate = true,
            exportedValue = this.exportedValue;

        if (valueObj.override == p_value) { return; }

        //valueObj.override = p_value;

        mkfCmds.SetPropertyOverride.emitter = this;
        mkfCmds.SetPropertyOverride.inputValue = p_value;
        mkfCmds.SetPropertyOverride.Execute();

        if (p_value) {
            if (!this.localValue) { this._data.Set(this._valueID, exportedValue); }
            else { manualUpdate = true; }
        } else {
            manualUpdate = true;
        }

        if (manualUpdate) {
            this._data.CommitValueUpdate(this._valueID, valueObj, exportedValue, false);
            this._data.CommitUpdate();
        }

    }

    _CleanUp() {
        this._onSubmitFn = null;
        this._cmd = null;
        super._CleanUp();
    }

}

module.exports = PropertyControl;
ui.Register(`mkfont-property-control`, PropertyControl);