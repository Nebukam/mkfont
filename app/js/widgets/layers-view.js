'use strict';

const nkm = require(`@nkmjs/core`);
const SIGNAL = require("../signal");
const u = nkm.u;
const ui = nkm.ui;

const ControlHeader = require(`./control-header`);
const PropertyControl= require(`./property-control`);
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

        this._dataObserver.Hook(SIGNAL.LAYERS_UPDATED, this._Bind(this._RefreshLayerControls));

        this._items = [];
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
            '.toolbar':{
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
                    group: `create`
                },
                {
                    icon: `visible`, htitle: `Show all components`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdLayersOn.Execute(this._data); } },
                    group: `edit`
                },
                {
                    icon: `hidden`, htitle: `Hide all components`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdLayersOff.Execute(this._data); } },
                    group: `edit`
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
        this._RefreshLayerControls();
    }

    _OnDataUpdated(p_data) {
        super._OnDataUpdated(p_data);
        let
            hasComp = false,
            uInfos = p_data.glyph.unicodeInfos;

        if (uInfos && uInfos.comp) { hasComp = true; }
        this._addCompBtn.disabled = !hasComp;
    }

    _RefreshLayerControls() {


        this._label._element.style.removeProperty(`display`);

        if (!this._data) {

            //this._items.forEach((item) => { item.Release(); });
            //this._items.length = 0;
            return;
        }

        let
            layerList = this._data.layers._array,
            diff = this._items.length - layerList.length;

        if (diff != 0) {
            if (diff > 0) {
                for (let i = 0; i < diff; i++) { this._items[layerList.length + i].Release(); }
            } else {
                diff = Math.abs(diff);
                for (let i = 0; i < diff; i++) {
                    let item = this.Attach(this.constructor.__layerControlClass, `item`, this._listCtnr);
                    item.editor = this.editor;
                    item.context = this._data;
                    this._items.push(item);
                }
            }
            this._items.length = layerList.length;
        }

        for (let i = 0, n = layerList.length; i < n; i++) { this._items[(n - 1) - i].data = layerList[i]; }
        if (layerList.length > 0) { this._label._element.style.setProperty(`display`, `none`); }
    }

    _CleanUp(){
        this._items.forEach((item) => { item.Release(); });
        this._items.length = 0;
        super._CleanUp();
    }


}

module.exports = LayersView;
ui.Register(`mkf-layer-view`, LayersView);