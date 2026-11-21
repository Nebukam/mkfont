// ============================================================
// .mkfont writer (v1 compatible)
//
// Output mirrors what v1 writes so files stay openable in v1:
// root { data, meta }, the same key order, computed layer paths,
// and the derived `empty` / `circ-dep` / `lyr-index` values.
// ============================================================

import type { Family, Glyph, GlyphData, KerningData, Layer, LayerData, MkFontFile, PathData, Variant, VariantData } from '../types/font'
import type { ComputedMap, LayerComputed, VariantComputed } from './compute'
import type { FitResult } from './transform'
import { comparePairs, pairSides, type Kerning } from './kerning'

function serializePathData(pd: PathData): Record<string, unknown> {
  const out: Record<string, unknown> = {
    exists: pd.exists,
    markedBBox: pd.markedBBox,
    path: pd.path,
    bbox: { ...pd.bbox },
    width: pd.width,
    height: pd.height
  }
  if (pd.emptyPath) out.emptyPath = true
  return out
}

function serializeFit(fit: FitResult): Record<string, unknown> {
  return {
    height: fit.height,
    width: fit.width,
    fit: { ...fit.fit },
    path: fit.path,
    bbox: { ...fit.bbox }
  }
}

function serializeLayer(layer: Layer, index: number, isControl: boolean, computed?: LayerComputed): LayerData {
  return {
    values: {
      path: computed?.fit ? serializeFit(computed.fit) : serializePathData(layer.path),
      inverted: layer.inverted,
      // v1 treats the mere presence of this key as "control layer" and only writes it
      // on the variant's control layer: never write `false`.
      ...(isControl ? { 'lyr-control': true } : {}),
      'circ-dep': computed?.circular ?? false,
      'lyr-char': layer.characterRef,
      'lyr-id': layer.customId,
      'do-export': layer.doExport,
      'lyr-index': index,
      'lyr-bounds-lyr': layer.inheritPreviousBounds,
      'lyr-bounds': layer.contextBounds,
      bounds: layer.layerBounds,
      'lyr-scale': layer.layerScale,
      'lyr-scale-factor': layer.layerScaleFactor,
      'nrm-factor': layer.normFactor,
      anchor: layer.contextAnchor,
      'lyr-anchor': layer.layerAnchor,
      xoffset: layer.xOffset,
      yoffset: layer.yOffset,
      mirror: layer.mirror,
      'skew-rot-order': layer.skewRotOrder,
      rot: layer.rotation,
      'rot-anchor': layer.rotationAnchor,
      'skew-x': layer.skewX,
      'skew-y': layer.skewY
    },
    expanded: layer.expanded
  }
}

function serializeVariant(variant: Variant, computed?: VariantComputed): VariantData {
  const out: VariantData = {
    values: {
      width: variant.width,
      height: variant.height,
      'path-data': serializePathData(variant.pathData),
      empty: computed?.empty ?? false,
      'do-export': variant.doExport,
      'flatten-layers': variant.flattenLayers,
      'flatten-mode': variant.flattenMode
    },
    transforms: { ...variant.transforms }
  }
  if (variant.layers.length > 0) {
    // One control layer per variant, the last flagged one (as computed).
    let control = -1
    variant.layers.forEach((l, i) => {
      if (l.isControlLayer) control = i
    })
    out.layers = variant.layers.map((l, i) => serializeLayer(l, i, i === control, computed?.layers[i]))
  }
  return out
}

function serializeGlyph(glyph: Glyph, computed?: VariantComputed[]): GlyphData {
  const out: GlyphData = {
    values: { name: glyph.name, unicode: glyph.unicode },
    variants: glyph.variants.map((v, i) => serializeVariant(v, computed?.[i]))
  }
  if (glyph.isLigature) out.isLiga = true
  return out
}

/** Kerning as [left, right, value] entries in glyph order (stable diffs). */
function serializeKerning(kerning: Kerning): KerningData {
  return [...kerning.keys()].sort(comparePairs).map((k) => {
    const [left, right] = pairSides(k)
    return [left, right, kerning.get(k)!]
  })
}

export interface SerializeOptions {
  computed?: ComputedMap
  meta?: MkFontFile['meta']
  /** Kerning pairs; written only when there are some (v1 ignores the key). */
  kerning?: Kerning
  /** Accented letters follow their base letter (the default); written only when off. */
  inheritKerning?: boolean
  /** Pretty-print output (v1 writes compact JSON). */
  pretty?: boolean
}

export function serializeMkFont(family: Family, glyphs: Map<string, Glyph>, options: SerializeOptions = {}): string {
  const uid = `${family.values['font-family']}-${family.values.style}`
  const file = {
    data: {
      values: { ...family.values },
      transforms: { ...family.transforms },
      selections: family.selections.map((s) => (s ? [...s] : null)),
      glyphs: Array.from(glyphs.values()).map((g) => serializeGlyph(g, options.computed?.get(g.unicode))),
      ...(options.kerning?.size ? { kerning: serializeKerning(options.kerning) } : {}),
      ...(options.inheritKerning === false ? { inheritKerning: false } : {})
    },
    meta: {
      // `constructor` exists on every object prototype, so check for a real string value.
      constructor:
        typeof options.meta?.constructor === 'string' ? options.meta.constructor : '@mkf:family-data-block',
      ver: typeof options.meta?.ver === 'number' ? options.meta.ver : -1,
      uid
    }
  }
  return options.pretty ? JSON.stringify(file, null, 2) : JSON.stringify(file)
}
