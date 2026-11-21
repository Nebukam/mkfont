// ============================================================
// MkFont v2 — Core type definitions
// ============================================================

// --- Enums (values match v1 save files) ---

export enum BoundsMode {
  Outside = 0,
  MixedVertical = 1,
  Inside = 2,
  MixedHorizontal = 3
}

export enum ScaleMode {
  None = 0,
  EM = 1,
  Ascender = 2,
  Spread = 3,
  XHeight = 4,
  CapHeight = 5,
  Height = 6,
  Manual = 7,
  Normalize = 8
}

export enum MirrorMode {
  None = 0,
  Horizontal = 1,
  Vertical = 2,
  Both = 3
}

export enum Anchor {
  TopLeft = 0,
  Top = 1,
  TopRight = 2,
  Left = 3,
  Center = 4,
  Right = 5,
  BottomLeft = 6,
  Bottom = 7,
  BottomRight = 8
}

export enum VAlign {
  Ascender = 0,
  Baseline = 1,
  Descender = 2,
  Spread = 3,
  EM = 4
}

export enum HAlign {
  XMin = 0,
  XMax = 1,
  Spread = 2
}

export enum SkewRotOrder {
  RXY = 0,
  RYX = 1,
  XRY = 2,
  YRX = 3,
  XYR = 4,
  YXR = 5
}

export enum FlattenMode {
  Fit = 0,
  Smart = 1
}

// --- Geometry ---

export interface BBox {
  x: number
  y: number
  width: number
  height: number
  top: number
  bottom: number
  left: number
  right: number
}

export interface FitRegion {
  width: number
  height: number
  x: number
  y: number
  yoff: number
}

/** Imported SVG data ("svg stats" in v1). Paths are Y-down, viewBox-relative. */
export interface PathData {
  exists: boolean
  markedBBox: boolean
  emptyPath?: boolean
  path: string
  width: number
  height: number
  bbox: BBox
  fit?: FitRegion
}

// --- Transform settings ---

/**
 * Keys that may be `null` on a variant, meaning "inherit the family value".
 * Mirrors the `nullable/propagate` descriptors of v1's TransformSettingsDataBlock.
 */
export const NULLABLE_TRANSFORM_KEYS = [
  'xshift',
  'xpush',
  'yoffset',
  'skew-rot-order',
  'rot',
  'rot-anchor',
  'skew-x',
  'skew-y'
] as const

export type NullableTransformKey = (typeof NULLABLE_TRANSFORM_KEYS)[number]

/** Fully resolved transform settings (family level, or a variant after inheritance). */
export interface ResolvedTransforms {
  bounds: number
  scale: number
  'scale-factor': number
  'nrm-factor': number
  valign: number
  halign: number
  anchor: number
  xshift: number
  xpush: number
  'auto-w': boolean
  yoffset: number
  mirror: number
  'skew-rot-order': number
  rot: number
  'rot-anchor': number
  'skew-x': number
  'skew-y': number
}

/** Variant transform settings: nullable keys inherit from the family. */
export type TransformSettings = Omit<ResolvedTransforms, NullableTransformKey> & {
  [K in NullableTransformKey]: number | null
}

// --- Family ---

export interface FamilyValues {
  'font-family': string
  style: string
  version: string
  copyright: string
  description: string
  url: string
  weight: number
  em: number
  'em-resample': boolean
  baseline: number
  ascent: number
  'asc-resample': boolean
  descent: number
  'cap-height': number
  'x-height': number
  width: number
  height: number
  monospace: boolean
  'color-preview': string
  'preview-size': number
  'u-position': number | null
  'u-thickness': number | null
}

/** A stored selection preset: list of unicode keys (v1 format). */
export type SelectionPreset = string[] | null

export interface Family {
  values: FamilyValues
  transforms: ResolvedTransforms
  selections: SelectionPreset[]
}

// --- Runtime glyph model ---

export interface Layer {
  /** Last computed path data as saved in files (informational, recomputed at runtime). */
  path: PathData
  inverted: boolean
  /** Referenced glyph: a character, a ligature string, or a `U+XXXX` string. */
  characterRef: string
  customId: string | null
  isControlLayer: boolean
  doExport: boolean
  inheritPreviousBounds: boolean
  /** v1 `bounds` — how the layer's own path bounds are measured. */
  layerBounds: number
  /** v1 `lyr-bounds` — how the context (host) bounds are measured. */
  contextBounds: number
  layerScale: number
  layerScaleFactor: number
  normFactor: number
  /** v1 `anchor` — anchor point within the context. */
  contextAnchor: number
  /** v1 `lyr-anchor` — anchor point of the layer itself. */
  layerAnchor: number
  xOffset: number
  yOffset: number
  mirror: number
  skewRotOrder: number
  rotation: number
  rotationAnchor: number
  skewX: number
  skewY: number
  /** UI state, persisted in files. */
  expanded: boolean
}

export interface Variant {
  width: number | null
  height: number | null
  pathData: PathData
  doExport: boolean
  flattenLayers: boolean
  flattenMode: number
  transforms: TransformSettings
  layers: Layer[]
}

export interface Glyph {
  /** Lowercase hex key, `+`-joined for ligatures ("0041", "0066+0069"). */
  unicode: string
  name: string
  isLigature: boolean
  variants: Variant[]
}

// --- File format (v1 compatible) ---

export interface LayerData {
  values: Record<string, unknown>
  expanded?: boolean
}

export interface VariantData {
  values: Record<string, unknown>
  transforms?: Record<string, unknown>
  layers?: LayerData[]
}

export interface GlyphData {
  values: {
    name: string
    unicode: string
  }
  isLiga?: true
  variants: VariantData[]
}

/** Kerning pairs in files (new in v2): [left glyph key, right glyph key, value]. */
export type KerningData = [string, string, number][]

export interface MkFontFileData {
  values: FamilyValues
  transforms: Record<string, unknown>
  selections?: (string[] | null)[]
  glyphs: GlyphData[]
  /** v2 only; v1 ignores it (and drops it when it saves the file). */
  kerning?: KerningData
  /** v2 only: false when accented letters do not follow their base letter's kerning. */
  inheritKerning?: boolean
}

export interface MkFontFile {
  metadata: Record<string, unknown>
  data: MkFontFileData
  meta?: {
    constructor: string
    ver: number
    uid: string
  }
}
