// ============================================================
// Model defaults & factories (v1-faithful defaults)
// ============================================================

import type {
  Family,
  FamilyValues,
  Glyph,
  Layer,
  PathData,
  ResolvedTransforms,
  TransformSettings,
  Variant
} from '../types/font'
import { NULLABLE_TRANSFORM_KEYS } from '../types/font'
import { makeBBox } from './geometry'

/** v1 IDS.EMPTY_PATH_CONTENT — placeholder path for glyphs without outlines. */
export const EMPTY_PATH_CONTENT = 'M 0 0 L 0 0 z'

export function isEmptyPathContent(p: string | null | undefined): boolean {
  if (!p) return true
  const t = p.trim()
  return t === '' || t === EMPTY_PATH_CONTENT || t === 'M0 0L0 0z' || t === 'M0 0L0 0Z'
}

/** v1 INFOS.LAYER_LIMIT */
export const LAYER_LIMIT = 50

/** Glyph paths beyond this range are flagged out-of-bounds (v1: ±24000). */
export const OOB_LIMIT = 24000

/** v1 TransformSettingsDataBlock.__VALUES */
export const DEFAULT_TRANSFORMS: ResolvedTransforms = Object.freeze({
  bounds: 1, // Mixed vertical
  scale: 2, // Ascender
  'scale-factor': 1,
  'nrm-factor': 0,
  valign: 1, // Baseline
  halign: 0, // XMin
  anchor: 6, // Bottom left
  xshift: 0,
  xpush: 0,
  'auto-w': true,
  yoffset: 0,
  mirror: 0,
  'skew-rot-order': 0,
  rot: 0,
  'rot-anchor': 4,
  'skew-x': 0,
  'skew-y': 0
}) as ResolvedTransforms

export const TRANSFORM_KEYS = Object.keys(DEFAULT_TRANSFORMS) as (keyof ResolvedTransforms)[]

export function createDefaultFamilyValues(): FamilyValues {
  return {
    // i18n-ignore: font data (fallback family name; a new font gets a translated one from app/document)
    'font-family': 'Untitled',
    // i18n-ignore: font data (default style name written into the font)
    style: 'Regular',
    version: '1.0',
    copyright: '',
    // i18n-ignore: font data (default description written into the font)
    description: 'Made with mkfont',
    url: '',
    weight: 400,
    em: 1000,
    'em-resample': true,
    baseline: 800,
    ascent: 800,
    'asc-resample': false,
    descent: -250,
    'cap-height': 700,
    'x-height': 504,
    width: 1000,
    height: 1000,
    monospace: false,
    'color-preview': '#f5f5f5',
    'preview-size': 100,
    'u-position': null,
    'u-thickness': null
  }
}

export function createFamily(values?: Partial<FamilyValues>): Family {
  return {
    values: { ...createDefaultFamilyValues(), ...values },
    transforms: { ...DEFAULT_TRANSFORMS },
    selections: Array(10).fill(null)
  }
}

/** v1 SVGOPS.EmptySVGStats() */
export function emptyPathData(): PathData {
  return {
    exists: true,
    markedBBox: false,
    path: EMPTY_PATH_CONTENT,
    bbox: makeBBox(0, 0, 0, 0),
    width: 0,
    height: 0,
    emptyPath: true
  }
}

/** Resolve nullable variant transforms against the family transforms. */
export function resolveTransforms(t: TransformSettings, family: ResolvedTransforms): ResolvedTransforms {
  const out = { ...t } as unknown as ResolvedTransforms
  for (const k of NULLABLE_TRANSFORM_KEYS) {
    const v = t[k]
    out[k] = (v ?? family[k] ?? DEFAULT_TRANSFORMS[k]) as number
  }
  return out
}

/** New variants copy the family transforms (v1 ActionCreateGlyph). */
export function createVariant(familyTransforms: ResolvedTransforms, overrides?: Partial<Variant>): Variant {
  return {
    width: null,
    height: null,
    pathData: emptyPathData(),
    doExport: true,
    flattenLayers: false,
    flattenMode: 1, // Smart
    transforms: { ...familyTransforms },
    layers: [],
    ...overrides
  }
}

/** v1 GlyphLayerDataBlock.__VALUES */
export function createLayer(characterRef = '', overrides?: Partial<Layer>): Layer {
  return {
    path: emptyPathData(),
    inverted: false,
    characterRef,
    customId: null,
    isControlLayer: false,
    doExport: true,
    inheritPreviousBounds: false,
    layerBounds: 0, // Outside
    contextBounds: 0, // Outside
    layerScale: 7, // Manual
    layerScaleFactor: 1,
    normFactor: 0,
    contextAnchor: 4, // Center
    layerAnchor: 4, // Center
    xOffset: 0,
    yOffset: 0,
    mirror: 0,
    skewRotOrder: 0,
    rotation: 0,
    rotationAnchor: 4,
    skewX: 0,
    skewY: 0,
    expanded: false,
    ...overrides
  }
}

export function createGlyph(unicode: string, familyTransforms: ResolvedTransforms, variant?: Partial<Variant>, name = ''): Glyph {
  return {
    unicode,
    name,
    isLigature: unicode.includes('+'),
    variants: [createVariant(familyTransforms, variant)]
  }
}

// --- EM resampling (v1 *_RESAMPLE_IDS) ---

/** Variant values measured in font units: rescaled when moved to a font with another EM. */
export const RESAMPLED_VARIANT_KEYS = ['width', 'height'] as const
/** Transform values measured in font units. */
export const RESAMPLED_TRANSFORM_KEYS = ['xshift', 'xpush', 'yoffset', 'scale-factor'] as const

/** Scale a variant's font-unit values in place (works on immer drafts too). */
export function resampleVariantInPlace(v: Variant, factor: number): void {
  if (factor === 1) return
  for (const k of RESAMPLED_VARIANT_KEYS) {
    const val = v[k]
    if (typeof val === 'number') v[k] = val * factor
  }
  const t = v.transforms as unknown as Record<string, unknown>
  for (const k of RESAMPLED_TRANSFORM_KEYS) if (typeof t[k] === 'number') t[k] = (t[k] as number) * factor
  for (const l of v.layers) resampleLayerInPlace(l, factor)
}

export function resampleLayerInPlace(l: Layer, factor: number): void {
  l.xOffset *= factor
  l.yOffset *= factor
}

/** A copy of a glyph for a font whose EM is `factor` times this one's. */
export function resampledGlyph(g: Glyph, factor: number): Glyph {
  const out = cloneGlyph(g)
  for (const v of out.variants) resampleVariantInPlace(v, factor)
  return out
}

// --- Structural clone helpers (immutable updates) ---

export function cloneLayer(l: Layer): Layer {
  return { ...l }
}

export function cloneVariant(v: Variant): Variant {
  return { ...v, transforms: { ...v.transforms }, layers: v.layers.map(cloneLayer) }
}

export function cloneGlyph(g: Glyph): Glyph {
  return { ...g, variants: g.variants.map(cloneVariant) }
}
