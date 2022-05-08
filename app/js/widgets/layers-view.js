'use strict';

const nkm = require(`@nkmjs/core`);
const SIGNAL = require("../signal");
const ui = nkm.ui;

const mkfData = require(`../data`);
const PropertyControl = require(`./property-control`);
const LayerControl = require(`./layer-control`);

const __nolayer = `nolayer`;

const base = nkm.datacontrols.ControlView;
class LayersView extends base {
    constructor() { super(); }

    static __layerControlClass = LayerControl;

    _Init() {
        super._Init();
        ui.helpers.HostSelStack(this, false, false);

        this._builder.defaultControlClass = PropertyControl;
        this._builder.defaultCSS = `control`;

        this._layerCtrls = [];

        //.Hook(SIGNAL.LAYERS_UPDATED, this._Bind(this._RefreshLayerControls));

        this._delayedReorder = nkm.com.DelayedCall(this._Bind(this._RefreshLayerOrder));
        this._delayedAttachFragment = nkm.com.DelayedCall(this._Bind(this._AttachFragment), 16);

        this._dataObserver
            .Hook(SIGNAL.LAYER_ADDED, this._Bind(this._OnLayerAdded))
            .Hook(SIGNAL.LAYER_REMOVED, this._Bind(this._OnLayerRemoved))
            .Hook(SIGNAL.LAYERS_UPDATED, this._delayedReorder.Schedule);

        this._flags.Add(this, __nolayer);

        this._fragment = null;

    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                //'@': ['fade-in'],
                'min-height': 'auto',
                'min-width': 'auto',
                //'padding': '20px',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                //'padding': '5px',
                'margin-bottom': '5px',
            },
            '.control': {
                'flex': '1 1 auto',
                'margin': `3px`,
                'user-select': 'none'
            },
            '.counter': {

            },
            '.checkbox': {
                'flex': '0 0 16px',
            },
            '.label': {
                'flex': '1 1 auto',
                'text-align': 'center'
            },
            ':host(:not(.nolayer)) .label': { 'display': `none` },
            '.btn': {
                'margin': '3px'
            },
            '.list': {
                'flex': '0 1 auto',
                'width': `100%`,
                'padding': `10px 0px`,
                'border-top': `1px solid rgba(127,127,127,0.25)`,
                'border-bottom': `1px solid rgba(127,127,127,0.25)`,
                'display': `flex`,
                'flex-flow': `column nowrap`,
                //'background-color':`rgba(19,19,19,0.25)`,
                'border-radius': `3px`
            },
            '.item': {
                'flex': '0 1 auto',
                'margin': `3px`,
                'user-select': 'none',
                'border-radius': '4px',
            },
            '.toolbar': {
                'align-self': `center`
            }
        }, base._Style());
    }

    _Render() {

        super._Render();
        this._toolbar = this.Attach(ui.WidgetBar, `control toolbar`);
        this._toolbar.options = {
            inline: true,
            defaultWidgetClass: nkm.uilib.buttons.Tool,
            handles: [
                {
                    icon: `component-new`, htitle: `Create new component`,
                    flavor: nkm.ui.FLAGS.CTA, variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdLayerAdd.Execute(this._data); } },
                    group: `create`, member: { owner: this, id: `_createBtn` }
                },
                {
                    icon: `minus`, htitle: `Collapse all`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this._CollapseAll(); } },
                    group: `ui`, member: { owner: this, id: `_collapseAllBtn` }
                },
                {
                    icon: `visible`, htitle: `Show all components`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdLayersOn.Execute(this._data); } },
                    group: `edit`, member: { owner: this, id: `_showAllBtn` }
                },
                {
                    icon: `hidden`, htitle: `Hide all components`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdLayersOff.Execute(this._data); } },
                    group: `edit`, member: { owner: this, id: `_hideAllBtn` }
                },
                {
                    icon: `link`, htitle: `Create composition components.`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdLayerAddComp.Execute(this._data); } },
                    group: `automate`, member: { owner: this, id: `_addCompBtn` }
                },
            ]
        };

        this._listCtnr = ui.El(`div`, { class: `list` }, this._host);
        this._label = new ui.manipulators.Text(ui.dom.El(`div`, { class: `label font-xsmall` }, this._listCtnr), false, false);
        this._label.Set(`<i>no layers</i>`);
    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        this._RebuildControls();
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        let
            hasComp = false,
            uInfos = p_data.glyph.unicodeInfos;

        if (uInfos && uInfos.comp) { hasComp = true; }
        this._addCompBtn.disabled = !hasComp;
    }

    _CollapseAll() {
        if (!this._data) { return; }
        this._data._layers.ForEach(lyr => { lyr.expanded = false; });
        this._layerCtrls.forEach(item => { item.Collapse(); });
    }

    _ClearControls() {
        this._layerCtrls.forEach(ctrl => { ctrl.Release(); });
        this._layerCtrls.length = 0;
        this._flags.Set(__nolayer, true);
    }

    _RebuildControls() {
        this._ClearControls();
        if (!this._data) { return; }
        this._data._layers.ForEach(lyr => { this._OnLayerAdded(this._data, lyr); });
        this._RefreshLayerOrder();
    }

    _OnLayerAdded(p_variant, p_layer) {

        // Hard cap 20 layers to preserve memory.
        if (this._layerCtrls.length >= mkfData.INFOS.LAYER_LIMIT) {
            this._createBtn.disabled = true;
            return;
        } else {
            this._createBtn.disabled = false;
        }

        if (!this._fragment) { this._fragment = document.createDocumentFragment(); }

        let ctrl = this.Attach(this.constructor.__layerControlClass, `item`, this._fragment);
        ctrl.editor = this.editor;
        ctrl.context = this._data;
        ctrl.data = p_layer;

        this._layerCtrls.push(ctrl);
        this._delayedAttachFragment.Bump();

    }

    _AttachFragment() {
        if (!this._fragment) { return; }
        ui.dom.Attach(this._fragment, this._listCtnr);
        this._RefreshLayerOrder();
    }

    _OnLayerRemoved(p_variant, p_layer) {

        let
            ctrl = null,
            index = -1;

        this._layerCtrls.forEach((item, i) => {
            if (item.data == p_layer) {
                ctrl = item;
                index = i;
            }
        });

        if (ctrl) {
            this._layerCtrls.splice(index, 1);
            ctrl.Release();
            this._delayedReorder.Schedule();
        }

    }

    _RefreshLayerOrder() {
        this._delayedReorder.Cancel();
        let ttl = this._layerCtrls.length - 1;
        this._layerCtrls.forEach((ctrl, i) => {
            ctrl.isFirstLayer = ctrl.data.index == 0;
            ctrl.isLastLayer = ctrl.data.index == ttl;
            ctrl.style.setProperty(`order`, ttl - ctrl.data.index);
        });
        this._flags.Set(__nolayer, this._layerCtrls.length <= 0);
    }

    _CleanUp() {
        this._ClearControls();
        super._CleanUp();
    }


}

module.exports = LayersView;
ui.Register(`mkf-layer-view`, LayersView);