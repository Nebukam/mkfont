'use strict';

const nkm = require(`@nkmjs/core`);
const SIGNAL = require("../signal");
const ui = nkm.ui;

const mkfData = require(`../data`);
const mkfOperations = require(`../operations`);
const mkfActions = mkfOperations.actions;

const LayerControl = require(`./layer-control`);
const GlyphPicker = require(`./glyph-picker`);
const SHARED_OPS = require("../operations/commands/shared-ops");

const __nolayer = `nolayer`;
const __limitReached = `limit-reached`;

const base = nkm.datacontrols.ControlView;
class LayersView extends base {
    constructor() { super(); }

    static __layerControlClass = LayerControl;

    _Init() {
        super._Init();
        ui.helpers.HostSelStack(this, false, false);

        this._Bind(this._OpenPicker)

        this._builder.defaultControlClass = nkm.datacontrols.widgets.ValueControl;
        this._builder.defaultCSS = `control`;

        this._layerCtrls = [];

        //.Hook(SIGNAL.LAYERS_UPDATED, this._Bind(this._RefreshLayerControls));

        this._delayedReorder = nkm.com.DelayedCall(this._Bind(this._RefreshLayerOrder));
        this._delayedAttachFragment = nkm.com.DelayedCall(this._Bind(this._AttachFragment), 16);

        this._dataObserver
            .Hook(SIGNAL.LAYER_ADDED, this._Bind(this._OnLayerAdded))
            .Hook(SIGNAL.LAYER_REMOVED, this._Bind(this._OnLayerRemoved))
            .Hook(SIGNAL.LAYERS_UPDATED, this._delayedReorder.Schedule);

        this._flags.Add(this, __nolayer, __limitReached);

        this._fragment = null;

    }

    static _Style() {
        return nkm.style.Extends({
            ':host': {
                //...nkm.style.rules.fadeIn,
                ...nkm.style.flex.column,
                'min-height': 'auto',
                'min-width': 'auto',
                //'padding': '20px',
                //'padding': '5px',
                'margin-bottom': '5px',
                '--limit': `0.5`,
            },
            '.control': {
                ...nkm.style.flexItem.fill,
                'margin': `3px`,
                'user-select': 'none'
            },
            '.counter': {

            },
            '.checkbox': {
                'flex': '0 0 16px',
            },
            '.label': {
                ...nkm.style.flexItem.fill,
                'text-align': 'center'
            },
            '.label.limit': { order: -1, 'margin-bottom': `3px`, opacity: `var(--limit)` },
            ':host(:not(.nolayer)) .label:not(.limit)': { 'display': `none` },

            ':host(.limit-reached) .label': { 'color': `var(--col-warning)`, },
            ':host(:not(.limit-reached)) .label:not(.limit)': { 'display': `none`, },

            '.btn': {
                'margin': '3px'
            },
            '.list': {
                ...nkm.style.flex.column,
                ...nkm.style.flexItem.shrink,
                'width': `100%`,
                'padding': `10px 0px`,
                'border-top': `1px solid rgba(127,127,127,0.25)`,
                'border-bottom': `1px solid rgba(127,127,127,0.25)`,
                //'background-color':`rgba(19,19,19,0.25)`,
                'border-radius': `3px`
            },
            '.item.collapsed': {
                'height': '38px'
            },
            '.item': {
                ...nkm.style.flexItem.shrink,
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
                    icon: `new`, htitle: `Create new component`,
                    flavor: nkm.ui.FLAGS.CTA, variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdLayerAdd.Execute(this._data); } },
                    group: `create`, member: { owner: this, id: `_createBtn` }
                },
                {
                    icon: `component-new`, htitle: `Search & create components`,
                    trigger: { fn: this._OpenPicker },
                    group: `create`, variant: ui.FLAGS.MINIMAL,
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
                    icon: `link`, htitle: `Create composition components and their glyphs, if missing.\n---\n+ [ Shift ] Create components recursively.\n+ [ Alt ] Does not create missing components' glyphs.\n+ [ Shift + Alt ] Create components & missing glyphs recursively.`,
                    variant: ui.FLAGS.MINIMAL,
                    trigger: { fn: () => { this.editor.cmdLayerAddComp.Execute(this._data); } },
                    group: `automate`, member: { owner: this, id: `_addCompBtn` }
                },
            ]
        };

        this._listCtnr = ui.El(`div`, { class: `list` }, this._host);
        this._label = new ui.manipulators.Text(ui.dom.El(`div`, { class: `label font-xsmall` }, this._listCtnr), true, false);
        //this._label.Set(`<i>no components</i>`);
        this._label.Set(null);

        this._limitLabel = new ui.manipulators.Text(ui.dom.El(`div`, { class: `limit label font-xsmall` }, this._listCtnr), false, false);
        this._limitLabel.Set(`<i>${mkfData.INFOS.LAYER_LIMIT} available.</i>`);
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
        this._data._layers.forEach(lyr => { lyr.expanded = false; });
        this._layerCtrls.forEach(item => { item.Collapse(); });
    }

    _ClearControls() {
        this._layerCtrls.forEach(ctrl => { ctrl.Release(); });
        this._layerCtrls.length = 0;
        this._flags.Set(__nolayer, true);
    }

    _RebuildControls() {
        this._ClearControls();
        if (!this._data) {
            this._RefreshLayerOrder();
            return;
        }
        this._data._layers.forEach(lyr => { this._OnLayerAdded(this._data, lyr); });
        this._AttachFragment();
        //this._RefreshLayerOrder();
    }

    _OnLayerAdded(p_variant, p_layer) {

        // Hard cap 20 layers to preserve memory.
        if (this._layerCtrls.length >= mkfData.INFOS.LAYER_LIMIT) { return; }

        if (!this._fragment) { this._fragment = document.createDocumentFragment(); }

        let ctrl = this.Attach(this.constructor.__layerControlClass, `item`, this._fragment);
        ctrl.editor = this.editor;
        ctrl.context = this._data;
        ctrl.data = p_layer;

        this._layerCtrls.push(ctrl);
        this._delayedAttachFragment.Bump();

    }

    _AttachFragment() {
        this._delayedAttachFragment.Cancel();
        if (!this._fragment) { return; }
        ui.dom.Attach(this._fragment, this._listCtnr);
        this._fragment = null;
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

        let limit = mkfData.INFOS.LAYER_LIMIT - this._layerCtrls.length;
        if (limit != 0) {
            this._flags.Set(__limitReached, false);
            this._limitLabel.Set(`<i>can hold ${limit} more</i>`);
            this._createBtn.disabled = false;
        } else {
            this._flags.Set(__limitReached, true);
            this._limitLabel.Set(`<i>limit of ${mkfData.INFOS.LAYER_LIMIT} components reached.</i>`);
            this._createBtn.disabled = true;
        }
        this.style.setProperty(`--limit`, 0.5 + (this._layerCtrls.length / mkfData.INFOS.LAYER_LIMIT) * 0.5);

    }

    _OpenPicker(p_layerControl = null) {

        this._glyphPicker = nkm.uilib.modals.Simple.Pop({
            anchor: p_layerControl || this,
            placement: ui.ANCHORING.LEFT,
            origin: ui.ANCHORING.RIGHT,
            margins: { x: -150, y: 0 },
            keepWithinScreen: true,
            content: GlyphPicker
        });

        this._glyphPicker.content.data = this.editor.data;

        if (p_layerControl) {
            // Only allow a single selection
            this._glyphPicker.content.allowMultiple = false;
            this._glyphPicker.content.selectionFn = (p_data) => {
                this._ChangeCurrentLayer(p_layerControl.data, p_data);
            };
            this._glyphPicker.content.handles = null;
        } else {
            this._glyphPicker.content.allowMultiple = true;
            this._glyphPicker.content.selectionFn = null;
            this._glyphPicker.content.handles = [{
                icon: `new`, label: `Add selected`, htitle: `Crate components from selection`,
                variant: ui.FLAGS.FRAME, flavor: ui.FLAGS.CTA,
                trigger: {
                    fn: () => {
                        let datas = [...this._glyphPicker.content.selectionStack.data.stack];
                        if (datas.length > 0) { this._CreateLayersFromSelection(datas); }
                        this._glyphPicker.Close();
                    }
                }
            }];
        }

    }

    _ChangeCurrentLayer(p_layer, p_selection) {
        if (p_layer.Get(mkfData.IDS.LYR_CHARACTER_NAME) == p_selection.char) { return; }
        this.editor.Do(mkfActions.SetProperty, {
            target: p_layer,
            id: mkfData.IDS.LYR_CHARACTER_NAME,
            value: p_selection.char
        });
    }

    _CreateLayersFromSelection(p_selection) {
        let editor = this.editor;
        editor.cmdLayersAddUInfos.unicodes = p_selection;
        editor.cmdLayersAddUInfos.Execute(this._data);
    }


    _CleanUp() {
        this._flags.Set(__limitReached, false);
        this._ClearControls();
        super._CleanUp();
    }


}

module.exports = LayersView;
ui.Register(`mkf-layer-view`, LayersView);