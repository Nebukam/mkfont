'use strict';

const u = nkm.u;

const nkmElectron = require('@nkmjs/core/electron');

const mkfData = require(`../../data`);
const mkfActions = require(`../../operations/actions`);

const base = nkm.com.Observable;
/**
 * @description TODO
 * @class
 * @hideconstructor
 * @memberof ui.core.helpers
 */
class BindingManager extends base {
    constructor(p_editor = null) {
        super();
        this._editor = p_editor;
        this._map = new Map();
        this._reverseMap = new Map();
        this._list = [];
        this._rscOptions = { cl: nkm.io.resources.TextResource };
    }

    Bind(p_variant, p_path) {

        let binding = this._map.get(p_variant);

        if (binding) {
            if (p_path == null) {
                this.Unbind(p_variant);
            } else {
                binding.path = p_path;
            }
            return;
        }

        //

        binding = nkm.com.Rent(nkmElectron.io.helpers.ResourceWatcher);
        binding
            .Watch(nkm.com.SIGNAL.RELEASED, this._OnBindingReleased, this)
            .Watch(nkm.io.IO_SIGNAL.READ_COMPLETE, this._OnReadComplete, this);

        binding.rscOptions = this._rscOptions;
        binding.readOnChange = true;
        binding.resourceBound = true;
        binding.releaseRscOnDelete = true;
        binding.path = p_path;
        binding.Enable();

        p_variant.CommitUpdate();

        this._list.Add(binding);
        this._map.set(p_variant, binding);
        this._reverseMap.set(binding, p_variant);

        this.Broadcast(nkm.com.SIGNAL.ITEM_ADDED, this, binding);

    }

    Unbind(p_variant) {

        let binding = this._map.get(p_variant);

        if (!binding) { return; }

        this._list.Remove(binding);
        this._map.delete(p_variant);
        this._reverseMap.delete(binding);

        binding
            .Unwatch(nkm.com.SIGNAL.RELEASED, this._OnBindingReleased, this)
            .Unwatch(nkm.io.IO_SIGNAL.READ_COMPLETE, this._OnReadComplete, this);

        // nkm.com.SIGNAL.ITEM_UPDATED
        if (binding.currentRsc) { binding.currentRsc.Release(); }
        else { binding.Release(); }

        p_variant.CommitUpdate();

        this.Broadcast(nkm.com.SIGNAL.ITEM_REMOVED, this, binding);

    }

    Get(p_variant) { return this._map.get(p_variant); }

    UnbindVariants(p_glyph) {
        p_glyph._variants.forEach((item) => { this.Unbind(p_glyph); });
    }

    _OnBindingReleased(p_binding) {
        let variant = this._reverseMap.get(p_binding);
        if (variant) { this.Unbind(variant); }
    }

    _OnReadComplete(p_binding, p_rsc) {

        console.log(`_OnReadComplete`);

        let variant = this._reverseMap.get(p_binding);
        if (!variant) { return; }

        let svgStats = { exists: false };

        try {
            svgStats = SVGOPS.SVGStats(p_rsc.raw, mkfData.INFOS.MARK_COLOR);
        } catch (e) { console.log(e); }

        if (!svgStats.exists) { return; }

        this._editor.Do(mkfActions.SetProperty, {
            target: variant,
            id: mkfData.IDS.PATH_DATA,
            value: svgStats
        });

    }

    /**
     * @description TODO
     */
    Clear() {
        while (this._list.length) { this.Unbind(this._reverseMap.get(this._list.last)); }
    }

    _CleanUp() {
        this.Clear();
        super._CleanUp();
    }

}

module.exports = BindingManager;