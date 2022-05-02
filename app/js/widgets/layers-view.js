'use strict';

const nkm = require(`@nkmjs/core`);
const SIGNAL = require("../signal");
const u = nkm.u;
const ui = nkm.ui;

const ControlHeader = require(`./control-header`);
const LayerControl = require(`./layer-control`);

const __nolayer = `nolayer`;

const base = nkm.datacontrols.ControlView;
class LayersView extends base {
    constructor() { super(); }

    _Init() {
        super._Init();
        this._InitSelectionStack(false, false);

        this._dataObserver.Hook(SIGNAL.LAYERS_UPDATED, this._Bind(this._RefreshLayerControls));

        this._items = [];
    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                '@': ['fade-in'],
                'min-height': 'auto',
                'min-width': 'auto',
                //'padding': '20px',
                'display': 'flex',
                'flex-flow': 'column nowrap',
                //'padding': '5px',
                'margin-bottom': '5px',
                'align-items': `center`
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
                'direction': 'rtl'
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
                'user-select': 'none'
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
                    icon: `new`, htitle: `Create new layer`,
                    flavor: nkm.ui.FLAGS.CTA, variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdLayerAdd.Execute(this._data); } },
                    group: `create`
                },
                {
                    icon: `visible`, htitle: `Show all layers`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdLayersOn.Execute(this._data); } },
                    group: `edit`
                },
                {
                    icon: `hidden`, htitle: `Hide all layers`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdLayersOff.Execute(this._data); } },
                    group: `edit`
                },
            ]
        };

        this._listCtnr = ui.El(`div`, { class: `list` }, this._host);

    }

    _OnDataChanged(p_oldData) {
        super._OnDataChanged(p_oldData);
        this._RefreshLayerControls();
    }

    _RefreshLayerControls() {

        if (!this._data) {
            this._items.forEach((item) => { item.Release(); });
            this._items.length = 0;
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
                    let item = this.Attach(LayerControl, `item`, this._listCtnr);
                    item.editor = this.editor;
                    item.context = this._data;
                    this._items.push(item);
                }
            }
            this._items.length = layerList.length;
        }

        for (let i = 0, n = layerList.length; i < n; i++) { this._items[(n - 1) - i].data = layerList[i]; }
    }


}

module.exports = LayersView;
ui.Register(`mkf-layer-view`, LayersView);