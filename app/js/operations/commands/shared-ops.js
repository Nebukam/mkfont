'use strict';
const nkm = require(`@nkmjs/core`);

const UNICODE = require(`../../unicode`);

const mkfData = require(`../../data`);
const mkfActions = require(`../actions`);

const SetPropertyMultiple = nkm.data.ops.actions.SetPropertyMultiple;
const SetProperty = nkm.data.ops.actions.SetPropertyValue;

/**
 * @description TODO
 * @class
 * @hideconstructor
 * @memberof data.core
 */
class SHARED_OPS {
    constructor() { }

    static CreateEmptyGlyph(p_editor, p_family, p_unicodeInfos) {

        p_editor.Do(mkfActions.GlyphCreate, {
            family: p_family,
            unicode: p_unicodeInfos,
            path: SVGOPS.EmptySVGStats(),
            transforms: {
                [mkfData.IDS.WIDTH]: p_family.Get(mkfData.IDS.WIDTH),
                [mkfData.IDS.TR_AUTO_WIDTH]: false
            }
        });

        return p_family.GetGlyph(p_unicodeInfos.u);

    }

    static RemoveLayers(p_editor, p_target) {

        let layers = [...p_target._layers];
        layers.forEach(layer => {
            if (layer._variant) {
                p_editor.Do(mkfActions.LayerRemove, {
                    target: layer
                });
            }
        });

    }

    static AddLayers(p_editor, p_target, p_source, p_scaleFactor = 1, p_expanded = null) {

        p_source._layers.forEach(layer => {
            if (p_target.availSlots <= 0) { return; }
            p_editor.Do(mkfActions.LayerAdd, {
                target: p_target,
                layerValues: mkfData.UTILS.Resample(layer.Values(), mkfData.IDS.LYR_RESAMPLE_IDS, p_scaleFactor, true),
                expanded: p_expanded == null ? layer.expanded : p_expanded
            });

        });

    }

    static AddLayersFromNameList(p_editor, p_target, p_nameList) {

        if (!p_nameList) { return; }

        p_nameList.forEach(name => {
            if (p_target.availSlots <= 0) { return; }
            let resolvedChar = UNICODE.ResolveString(name);
            if (p_target.HasLayer(resolvedChar)) { return; }
            p_editor.Do(mkfActions.LayerAdd, {
                target: p_target,
                layerValues: { [mkfData.IDS.LYR_CHARACTER_NAME]: resolvedChar },
                expanded: false
            });
        });

    }

    static AddLayersFromList(p_editor, p_target, p_unicodeInfos) {

        if (!p_unicodeInfos) { return; }

        p_unicodeInfos.forEach(infos => {
            if (p_target.availSlots <= 0) { return; }
            p_editor.Do(mkfActions.LayerAdd, {
                target: p_target,
                layerValues: { [mkfData.IDS.LYR_CHARACTER_NAME]: infos.char },
                expanded: false
            });
        });

    }

    static PasteLayers(p_target, p_source, p_scaleFactor = 1) {

        let resample = p_scaleFactor != 1;

        p_source._layers.forEach(layerSource => {

            if (p_target.availSlots <= 0) { return; }

            let
                newLayer = nkm.com.Rent(mkfData.GlyphLayer),
                lyrValues = layerSource.Values();

            p_target.AddLayer(newLayer);

            if (resample) {
                mkfData.UTILS.Resample(lyrValues, mkfData.IDS.LYR_RESAMPLE_IDS, p_scaleFactor, true);
            }

            newLayer.BatchSet(lyrValues);

        });

    }

    static PasteLayersTransforms(p_editor, p_target, p_source, p_scaleFactor = 1) {

        let resample = p_scaleFactor != 1;

        p_source._layers.forEach(layerSource => {

            if (p_target.availSlots <= 0) { return; }

            let srcId = layerSource.Get(mkfData.IDS.LYR_CHARACTER_NAME);

            p_target._layers.forEach(layerTarget => {
                if (layerTarget.Get(mkfData.IDS.LYR_CHARACTER_NAME) == srcId) {
                    let lyrValues = layerSource.Values();
                    if (resample) { mkfData.UTILS.Resample(lyrValues, mkfData.IDS.LYR_RESAMPLE_IDS, p_scaleFactor, true); }
                    p_editor.Do(SetPropertyMultiple, {
                        target: layerTarget,
                        values: lyrValues
                    });
                }
            });

        });

    }

    static BoostrapComp(p_editor, p_target, p_uInfos, p_createMissingGlyph = true, p_recursive = false) {

        if (!p_uInfos.comp) { return; }

        let
            maxw = 0,
            hasLayersAlready = !p_target._layers.isEmpty,
            doControl = !hasLayersAlready,
            family = p_target.glyph.family;

        if (p_createMissingGlyph) {
            p_uInfos.comp.forEach((c, i) => {

                let
                    g = family.GetGlyph(c),
                    uInfos = UNICODE.GetInfos(c, false);

                if (g.isNull) {
                    g = this.CreateEmptyGlyph(p_editor, family, uInfos);
                    this.BoostrapComp(p_editor, g.activeVariant, uInfos, true, p_recursive);
                }

            });
        }

        p_uInfos.comp.forEach((c, i) => {

            let
                ch = UNICODE.GetUnicodeCharacter(Number.parseInt(c, 16)),
                lyr = p_target.TryGetLayer(ch, `U+${c}`);

            if (p_target.availSlots <= 0) { return; }

            if (!lyr) {
                // Layer is missing and will be created   

                let lyrValues = {
                    [mkfData.IDS.LYR_CHARACTER_NAME]: ch,
                    [mkfData.IDS.LYR_IS_CONTROL_LAYER]: false,
                    [mkfData.IDS.TR_LYR_BOUNDS_MODE]: mkfData.ENUMS.BOUNDS_MIXED_VER,
                    [mkfData.IDS.TR_ANCHOR]: mkfData.ENUMS.ANCHOR_BOTTOM,
                    [mkfData.IDS.TR_BOUNDS_MODE]: mkfData.ENUMS.BOUNDS_OUTSIDE,
                    [mkfData.IDS.TR_LYR_SELF_ANCHOR]: mkfData.ENUMS.ANCHOR_BOTTOM,
                };

                if (doControl) {
                    lyrValues[mkfData.IDS.LYR_IS_CONTROL_LAYER] = (i == 0) ? true : false;
                    lyrValues[mkfData.IDS.TR_BOUNDS_MODE] = mkfData.ENUMS.BOUNDS_MIXED_VER;
                    lyrValues[mkfData.IDS.TR_ANCHOR] = mkfData.ENUMS.ANCHOR_BOTTOM_LEFT;
                    lyrValues[mkfData.IDS.TR_LYR_SELF_ANCHOR] = mkfData.ENUMS.ANCHOR_BOTTOM_LEFT;
                    doControl = false;
                }

                p_editor.Do(mkfActions.LayerAdd, {
                    target: p_target,
                    layerValues: lyrValues,
                    index: -1,
                    expanded: false,
                });

                let g = family.GetGlyph(c);
                if (!g.isNull) { maxw = Math.max(maxw, g.activeVariant.Get(mkfData.IDS.EXPORTED_WIDTH)); }
            }

        });

        if (!hasLayersAlready && maxw) {
            p_editor.Do(SetPropertyMultiple, {
                target: p_target,
                values: {
                    [mkfData.IDS.TR_AUTO_WIDTH]: false,
                    [mkfData.IDS.WIDTH]: maxw
                }
            });
        }

    }

    static GetGlyphListDependencies(p_sources, p_destFamily) {

        let result = [];
        p_sources.forEach(g => {
            this.GetGlyphDependencies(g, result, p_sources, p_destFamily);
        });
        return result;

    }

    static GetGlyphDependencies(p_glyph, p_pool, p_exclude, p_destFamily) {

        if (p_glyph.isNull) { return; }

        p_glyph.activeVariant._layers.forEach(layer => {
            if (layer._glyphInfos && layer.importedVariant) {
                let g = layer.importedVariant.glyph;
                if (!g.isNull && !p_exclude.includes(g)) {
                    let destGlyph = p_destFamily.GetGlyph(layer._glyphInfos.u);
                    if (destGlyph.isNull) {
                        if (!p_pool.includes(g)) {
                            p_pool.push(g);
                            this.GetGlyphDependencies(g, p_pool, p_exclude, p_destFamily);
                        }
                    }
                }
            }
        });

    }

    //#region Clipboard

    static _sourceEditor = null;
    static get sourceEditor() { return this._sourceEditor; }

    static _sourceInfos = null;
    static get sourceInfos() { return this._sourceInfos; }

    static _sourceFamily = null;
    static get sourceFamily() { return this._sourceFamily; }

    static _existingSourceGlyphs = null;
    static get existingGlyphs() { return this._existingSourceGlyphs; }

    static _copiedString = null;
    static get copiedString() { return this._copiedString; }

    static Clear() {

        if (this._sourceFamily) { this._sourceFamily.Unwatch(nkm.com.SIGNAL.RELEASED, this.Clear, this); }

        this._sourceEditor = null;
        this._sourceFamily = null;
        this._copiedString = null;

        if (this._sourceInfos) { this._sourceInfos.length = 0; }
        this._sourceInfos = null;

        if (this._existingSourceGlyphs) { this._existingSourceGlyphs.length = 0; }
        this._existingSourceGlyphs = null;

    }

    static CopyFrom(p_editor) {

        this.Clear();

        this._sourceFamily = p_editor.data;

        if (!this._sourceFamily) { return; }
        else { this._sourceFamily.Watch(nkm.com.SIGNAL.RELEASED, this.Clear, this); }

        this._sourceEditor = p_editor;

        try {

            this._copiedString = `<!-- Generator: MkFont -->`;

            for (let i = 0, n = p_editor.inspectedData.stack.length; i < n; i++) {
                let eg = p_editor.data.GetGlyph(p_editor.inspectedData.stack[i].u);
                if (!eg.isNull) {
                    this._copiedString = SVGOPS.SVGFromGlyphVariant(eg.activeVariant, true);
                    break;
                }
            }

            navigator.clipboard.writeText(this._copiedString);

        } catch (e) { this._copiedString = null; console.warn(e); }

        let copyArray = [];
        p_editor.inspectedData.stack.forEach(infos => { copyArray.push(infos); });

        if (copyArray.length == 0) { this.Clear(); }
        this._sourceInfos = copyArray;

    }


    static MODE_DEFAULT = 0;
    static MODE_MATCH_SLOT = 1;
    static MODE_TRANSFORMS_ONLY = 2;
    static MODE_CUSTOM = 3;

    /**
     * 
     * @param {*} p_editor 
     * @param {*} p_pasteMode =  
     * @returns 
     */
    static PasteTo(p_editor, p_pasteMode = -1, p_customFn = null) {

        let ignoreSet = false;
        if (!this._sourceFamily || !p_editor.data || !this._sourceInfos) { return false; }
        if (p_pasteMode == this.MODE_MATCH_SLOT) {
            if (this._sourceEditor == p_editor) { return false; }
            ignoreSet = true;
        }

        //Gather all existing glyph in copy order
        let
            sourceList = [],
            sourceSet = new Set();

        this._sourceInfos.forEach(unicodeInfos => {
            let glyph = this._sourceFamily.GetGlyph(unicodeInfos.u);
            if (glyph.isNull) { return; }
            sourceSet.add(unicodeInfos);
            sourceList.push(glyph);
        });

        if (sourceList.length == 0) { return false; }

        let scaleFactor = p_editor.data.Get(mkfData.IDS.EM_UNITS) / this._sourceFamily.Get(mkfData.IDS.EM_UNITS),
            selection = p_editor.inspectedData.stack,
            index = 0, maxIndex = sourceList.length;

        switch (p_pasteMode) {
            case this.MODE_DEFAULT:

                if (selection.length == 0) { return false; }

                selection.forEach(selectedInfos => {
                    if (ignoreSet && sourceSet.has(selectedInfos)) { return; }
                    if (index >= maxIndex) { index = 0; }
                    this._Paste(p_editor, sourceList[index], selectedInfos, scaleFactor);
                    index++;
                });

                return true;

                break;

            case this.MODE_TRANSFORMS_ONLY:

                if (selection.length == 0) { return false; }

                selection.forEach(selectedInfos => {
                    if (ignoreSet && sourceSet.has(selectedInfos)) { return; }
                    if (index >= maxIndex) { index = 0; }
                    this._PasteTransforms(p_editor, sourceList[index], selectedInfos, scaleFactor);
                    index++;
                });

                return true;

                break;
            case this.MODE_MATCH_SLOT:

                // Create & copy required missing dependencies for the paste to be as complete as possible
                let layerDependencies = this.GetGlyphListDependencies(sourceList, p_editor.data);
                layerDependencies.forEach(depGlyph => {
                    this._Paste(p_editor, depGlyph, depGlyph.unicodeInfos, scaleFactor);
                });

                // Then regular paste to destination.
                sourceList.forEach(sourceGlyph => {
                    this._Paste(p_editor, sourceGlyph, sourceGlyph.unicodeInfos, scaleFactor);
                });

                return true;

                break;
            case this.MODE_CUSTOM:

                if (selection.length == 0) { return false; }

                selection.forEach(selectedInfos => {
                    if (ignoreSet && sourceSet.has(selectedInfos)) { return; }
                    if (index >= maxIndex) { index = 0; }
                    nkm.u.Call(p_customFn, p_editor, sourceList[index], selectedInfos, scaleFactor);
                    index++;
                });

                return true;

                break;
        }

        return false;

    }

    static _Paste(p_editor, p_sourceGlyph, p_unicodeInfos, p_scaleFactor) {

        if (!p_sourceGlyph || p_sourceGlyph.isNull) { return; }

        let
            sourceVariant = p_sourceGlyph.activeVariant,
            targetVariant = null,
            variantValues = sourceVariant.Values(),
            trValues = sourceVariant._transformSettings.Values(),
            targetGlyph = p_editor.data.GetGlyph(p_unicodeInfos.u),
            pathData = sourceVariant.Get(mkfData.IDS.PATH_DATA);

        mkfData.UTILS.Resample(variantValues, mkfData.IDS.GLYPH_RESAMPLE_IDS, p_scaleFactor, true);
        mkfData.UTILS.Resample(trValues, mkfData.IDS.TR_RESAMPLE_IDS, p_scaleFactor, true);

        if (!targetGlyph || targetGlyph.isNull) { //Need to create new glyph

            p_editor.Do(mkfActions.GlyphCreate, {
                family: p_editor.data,
                unicode: p_unicodeInfos,
                transforms: trValues,
                variantValues: variantValues,
                path: pathData
            });

            targetGlyph = p_editor.data.GetGlyph(p_unicodeInfos.u);
            targetVariant = targetGlyph.activeVariant;

            if (!sourceVariant._layers.isEmpty) {
                SHARED_OPS.PasteLayers(targetVariant, sourceVariant, p_scaleFactor);
            }

        } else { //Just need to update existing glyph

            targetVariant = targetGlyph.activeVariant;

            if (sourceVariant == targetVariant) { return; }

            p_editor.Do(SetProperty, {
                target: targetVariant,
                id: mkfData.IDS.PATH_DATA,
                value: pathData
            });

            p_editor.Do(SetPropertyMultiple, {
                target: targetVariant.transformSettings,
                values: trValues
            });

            p_editor.Do(SetPropertyMultiple, {
                target: targetVariant,
                values: variantValues
            });

            SHARED_OPS.RemoveLayers(p_editor, targetVariant);

            if (!sourceVariant._layers.isEmpty) {
                SHARED_OPS.AddLayers(p_editor, targetVariant, sourceVariant, p_scaleFactor);
            }

        }

        targetVariant.CommitUpdate();

    }

    static _PasteTransforms(p_editor, p_sourceGlyph, p_unicodeInfos, p_scaleFactor) {

        if (!p_sourceGlyph || p_sourceGlyph.isNull) { return; }

        let
            sourceVariant = p_sourceGlyph.activeVariant,
            targetGlyph = p_editor.data.GetGlyph(p_unicodeInfos.u),
            targetVariant = targetGlyph.activeVariant;

        if (!targetGlyph || targetGlyph.isNull) { return; }

        if (sourceVariant == targetVariant) { return; }

        let srcValues = sourceVariant.Values();
        delete srcValues[mkfData.IDS.PATH_DATA];

        p_editor.Do(SetPropertyMultiple, {
            target: targetVariant,
            values: mkfData.UTILS.Resample(sourceVariant.Values(), mkfData.IDS.GLYPH_RESAMPLE_IDS, p_scaleFactor, true)
        });

        p_editor.Do(SetPropertyMultiple, {
            target: targetVariant.transformSettings,
            values: mkfData.UTILS.Resample(sourceVariant._transformSettings.Values(), mkfData.IDS.TR_RESAMPLE_IDS, p_scaleFactor, true)
        });

        targetVariant.CommitUpdate();

    }

    //#endregion


}

module.exports = SHARED_OPS;