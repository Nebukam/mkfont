'use strict';

const nkm = require(`@nkmjs/core`);
const mkfOperations = require(`../../operations`);

const mkfData = require(`../../data`);

const SIGNAL = require(`../../signal`);


const base = nkm.com.pool.DisposableObjectEx;
class Surveyor extends base {
    constructor() { super(); }

    static __controls = [];

    _Init() {
        super._Init();

        // Surveys a selection of glyphs

        this._context = null;
        this._refVariant = null;
        this._refTransform = null;

        this._dataObserver = new nkm.com.signals.Observer();
        this._dataObserver
            .Hook(nkm.com.SIGNAL.UPDATED, this._OnDataUpdated, this);

        this._contextObserver = new nkm.com.signals.Observer();
        this._contextObserver
            .Hook(SIGNAL.GLYPH_ADDED, this._OnGlyphAdded, this)
            .Hook(SIGNAL.GLYPH_REMOVED, this._OnGlyphRemoved, this)
            .Hook(nkm.com.SIGNAL.UPDATED, this._OnContextUpdated, this);

        this._refObserver = new nkm.com.signals.Observer();
        this._refObserver
            .Hook(nkm.com.SIGNAL.VALUE_CHANGED, this._OnRefGlyphValueChanged, this)
            .Hook(SIGNAL.LAYER_VALUE_CHANGED, this._OnRefLayerValueChanged, this)
            .Hook(SIGNAL.LAYER_REMOVED, this._OnRefLayerRemoved, this)
            .Hook(SIGNAL.SELECTED_LAYER_CHANGED, this._RefLayerSelected, this);
        this._refObserver.enabled = false;

        this._cachedVariantsObserver = new nkm.com.signals.Observer();
        this._cachedVariantsObserver
            .Hook(SIGNAL.LAYERS_UPDATED, this._OnCachedVariantLayerUpdate, this);

        this._trRefObserver = new nkm.com.signals.Observer();
        this._trRefObserver
            .Hook(nkm.com.SIGNAL.VALUE_CHANGED, this._OnTransformValueChanged, this);
        this._trRefObserver.enabled = false;

        this._delayedUpdate = nkm.com.DelayedCall(this._Bind(this._Update), 16);

        this._cachedTransforms = null;
        this._cachedVariants = null;
        this._cachedLayers = null;

    }

    set editor(p_value) {
        if (this._editor == p_value) { return; }
        this._editor = p_value;
        if (this._editor) {
            this.context = this._editor.data;
        } else {
            this.context = null;
            this.data = null;
        }
    }

    get data() { return this._data; }
    set data(p_value) {
        if (this._data == p_value) { return; }
        this._data = p_value;
        this._dataObserver.ObserveOnly(this._data);
        if (this._data) { this._OnDataUpdated(this._data); }
    }

    get context() { return this._context; }
    set context(p_value) {
        if (this._context == p_value) { return; }
        this._context = p_value;
        this._contextObserver.ObserveOnly(this._context);
        if (this._context) {
            this._refVariant = this._context.refGlyph.activeVariant;
            this._refTransform = this._refVariant._transformSettings;
        } else {
            this._refVariant = null;
            this._refTransform = null;
        }

        this._refObserver.ObserveOnly(this._refVariant);
        this._trRefObserver.ObserveOnly(this._refTransform);

    }

    get variant() { return this._refVariant; }
    get transforms() { return this._refTransform; }

    _OnDataUpdated(p_data) { this._Update(); }

    _OnGlyphAdded(p_family, p_glyph) { this._delayedUpdate.Bump(); }
    _OnGlyphRemoved(p_family, p_glyph) { this._delayedUpdate.Bump(); }
    _OnContextUpdated(p_family) { this._delayedUpdate.Bump(); }

    _Update() {


        // Mute observer for the duration of the update
        this._trRefObserver.enabled = false;
        this._refObserver.enabled = false;
        this._cachedVariantsObserver.Flush();

        this._delayedUpdate.Cancel();
        let hasContent = false;

        if (!this._data) {

            this._cachedTransforms = null;
            this._cachedVariants = null;

            if (this._cachedLayers) {
                this._cachedLayers.clear();
                this._cachedLayers = null;
            }

            this.Broadcast(nkm.com.SIGNAL.UPDATED, hasContent);
            return;
        }

        // First, check if there is enough comparable data within the selection.

        let analytics = this._data.analytics;
        this.hasBinding = false;

        // We need at least two existing glyphs : one for the baseline
        // and at least another to make a comparison
        if (analytics.existingGlyphs >= 2) {



            // First, rebuild the caches we will compare against
            this._RebuildCache(analytics);

            // Then find common values within the cache and update the
            // reference object

            // Update all transforms
            mkfData.UTILS.FindCommonValues(this._refVariant, this._cachedVariants, null, [mkfData.IDS.SHOW_ALL_LAYERS]);
            mkfData.UTILS.FindCommonValues(this._refTransform, this._cachedTransforms);

            // Note : Layers are updated along with the cache

            // Check if any variant is currently bound to a resource
            for (let i = 0; i < this._cachedVariants.length; i++) {
                if (this._editor._bindingManager.Get(this._cachedVariants[i])) { this.hasBinding = true; break; }
            }

            hasContent = true;

            this._trRefObserver.enabled = true;
            this._refObserver.enabled = true;
            this._cachedVariantsObserver.enabled = true;

            this._cachedVariants.forEach(v => { this._cachedVariantsObserver.Observe(v); });

        } else {

            this._cachedTransforms = null;
            this._cachedVariants = null;

            if (this._cachedLayers) {
                this._cachedLayers.clear();
                this._cachedLayers = null;
            }

        }

        this.Broadcast(nkm.com.SIGNAL.UPDATED, hasContent);

    }

    _RebuildCache(p_analytics) {

        let
            rebuild = this._cachedVariants ? false : true,
            existing = p_analytics.existing;

        if (!rebuild) {
            // A cache exists, check if it needs to be rebuilt
            if (existing.length == this._cachedVariants.length) {
                checkloop: for (let i = 0; i < existing.length; i++) {
                    if (!this._cachedVariants.includes(existing[i])) {
                        rebuild = true;
                        break checkloop;
                    }
                }
            } else { rebuild = true; }
        }

        if (!rebuild) {
            if (this._cachedVariants) {
                // Still need to check layer cache...
                this._RebuildLayerCache();
            }
            return;
        }

        this._cachedTransforms = [];
        this._cachedVariants = [];

        if (this._cachedLayers) {
            this._cachedLayers.clear();
            this._cachedLayers = null;
        }

        existing.forEach(variant => {
            this._cachedVariants.push(variant);
            this._cachedTransforms.push(variant._transformSettings);
        });

        this._RebuildLayerCache();

    }

    _RebuildLayerCache() {

        this._rebuildingLayers = true;

        let
            includeAll = this._refVariant.Get(mkfData.IDS.SHOW_ALL_LAYERS),
            layerIds = {},
            layerStack = [],
            validSet = new Set(),
            vCount = this._cachedVariants.length,
            refLayerList = this._refVariant._layers._array,
            needRebuild = true;

        // Organize layer by names & count

        this._cachedVariants.forEach(variant => {

            variant._layers.ForEach(layer => {

                let
                    id = layer.Get(mkfData.IDS.LYR_CHARACTER_NAME) || `____null___`,
                    obj = layerIds[id];

                if (!obj) {
                    obj = { id: id, count: 0, layers: [], nfos: layer._glyphInfos, expanded: true };
                    layerIds[id] = obj;
                    layerStack.push(obj);
                }

                obj.count += 1;
                obj.layers.push(layer);

                if ((includeAll || obj.count == vCount) && obj.count >= 2) { validSet.add(obj); }

                if (!layer.expanded) { obj.expanded = false; }

            });

        });

        //Before replacing the layerMap, check if the provided one (if any) is still valid
        if (this._cachedLayers && refLayerList.length == validSet.size) {

            // Number of layer still matches.
            needRebuild = false;

            for (let m = 0, mn = refLayerList.length; m < mn; m++) {
                let
                    layer = refLayerList[m],
                    id = layer.Get(mkfData.IDS.LYR_CHARACTER_NAME) || `____null___`;

                if (!(id in layerIds)) {
                    // Some ID couldn't be found.
                    needRebuild = true; break;
                }
            }


            if (!needRebuild) {

                // Refresh common values, since we don't need to rebuild everything (great)
                refLayerList.forEach(ref => {
                    let
                        id = ref.Get(mkfData.IDS.LYR_CHARACTER_NAME) || `____null___`,
                        layerInfos = layerIds[id],
                        newArray = layerInfos.layers,
                        sameContent = true;

                    if (ref.surveyedList.length == newArray.length) {
                        for (let i = 0, n = ref.surveyedList.length; i < n; i++) {
                            if (!newArray.includes(ref.surveyedList[i])) {
                                sameContent = false; break;
                            }
                        }
                    } else {
                        sameContent = false;
                    }

                    if (sameContent) { newArray = ref.surveyedList; }

                    ref._useCount = newArray.length;
                    ref._glyphInfos = layerInfos.nfos;
                    ref.expanded = layerInfos.expanded;
                    this._cachedLayers.set(ref, newArray);
                    ref.surveyedList = newArray;

                    mkfData.UTILS.FindCommonValues(ref, newArray);
                    ref.CommitUpdate();

                });

                this._rebuildingLayers = false;
                return;
            }

        }

        if (this._cachedLayers) {
            this._cachedLayers.clear();
            this._cachedLayers = null;
        }

        layerStack.sort((a, b) => { return b.count - a.count });

        this._refVariant._ClearLayers();
        this._cachedLayers = new Map();

        // Sort layers by count

        for (let i = 0, n = layerStack.length; i < n; i++) {
            let obj = layerStack[i];
            if ((includeAll || obj.count == vCount) && obj.count >= 2) {
                let newLayer = nkm.com.Rent(mkfData.GlyphLayer);

                newLayer.expanded = obj.expanded;
                newLayer._useCount = obj.count;
                newLayer._glyphInfos = obj.nfos;
                newLayer.surveyedList = obj.layers;

                this._refVariant.AddLayer(newLayer);

                this._cachedLayers.set(newLayer, obj.layers);

                mkfData.UTILS.FindCommonValues(newLayer, obj.layers);
                newLayer.CommitUpdate();
            }
        }

        this._rebuildingLayers = false;

    }

    _ClearRscBindings() {
        this._cachedVariants.forEach(variant => {
            this._editor._bindingManager.Unbind(variant);
        });
    }

    //#region Apply changes

    _OnTransformValueChanged(p_data, p_id, p_valueObj, p_oldValue) {

        this._editor.Do(
            mkfOperations.actions.SetProperty, {
            target: this._cachedTransforms, id: p_id, value: p_valueObj.value
        });

    }

    _OnRefGlyphValueChanged(p_data, p_id, p_valueObj, p_oldValue) {

        if (p_id == mkfData.IDS.SHOW_ALL_LAYERS) {
            this._RebuildLayerCache();
            return;
        }

        this._editor.Do(
            mkfOperations.actions.SetProperty, {
            target: this._cachedVariants, id: p_id, value: p_valueObj.value
        });

    }

    _OnRefLayerValueChanged(p_variant, p_layer, p_id, p_valueObj, p_oldValue) {

        if (p_id == mkfData.IDS.LYR_INDEX) { return; } //p_id == mkfData.IDS.LYR_IS_CONTROL_LAYER

        let layerList = p_layer.surveyedList;

        if (!layerList || layerList.length == 0) { return; }

        if (p_id == mkfData.IDS.LYR_IS_CONTROL_LAYER) {
            this._editor.cmdLayerControl.toggle = p_valueObj.value;
            this._editor.cmdLayerControl.Execute(layerList);
            return;
        }
        //layerList.forEach(lyr => { lyr.expanded = p_layer.expanded; });

        this._editor.Do(
            mkfOperations.actions.SetProperty, {
            target: layerList, id: p_id, value: p_valueObj.value
        });

    }

    _OnCachedVariantLayerUpdate(p_variant, p_layer) {
        this._delayedUpdate.Bump();
    }

    _OnRefLayerRemoved(p_variant, p_layer) {
        if (!this._cachedLayers) { return; }
        this._editor.cmdLayerRemove.Execute(p_layer.surveyedList);
    }

    _RefLayerSelected(p_variant, p_layer) {

    }

    _CleanUp() {
        super._CleanUp();
    }
}

module.exports = Surveyor;