// ============================================================
// .mkfont reader (v1 compatible)
// ============================================================

import type {
  Family,
  FamilyValues,
  Glyph,
  GlyphData,
  Layer,
  LayerData,
  MkFontFile,
  PathData,
  ResolvedTransforms,
  SelectionPreset,
  TransformSettings,
  Variant,
  VariantData
} from '../types/font'
import { NULLABLE_TRANSFORM_KEYS } from '../types/font'
import { makeBBox } from './geometry'
import { DEFAULT_TRANSFORMS, createDefaultFamilyValues, createLayer, emptyPathData, isEmptyPathContent } from './model'
import { normalizeKey } from './unicode-keys'
import { pairKey, type Kerning } from './kerning'
import { MessageError, msg } from '../i18n/message'

/** A file that is not a .mkfont project; its message is translated where it is shown (`errorMessage`). */
export class MkFontParseError extends MessageError {}

const num = (v: unknown, fallback: number): number => (typeof v === 'number' && isFinite(v) ? v : fallback)
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback)
const str = (v: unknown, fallback: string): string => (typeof v === 'string' ? v : fallback)

function parseBBox(raw: unknown): PathData['bbox'] {
  if (!raw || typeof raw !== 'object') return makeBBox(0, 0, 0, 0)
  const b = raw as Record<string, unknown>
  return makeBBox(num(b.x, 0), num(b.y, 0), num(b.width, 0), num(b.height, 0))
}

export function parsePathData(raw: unknown): PathData {
  if (!raw || typeof raw !== 'object') return emptyPathData()
  const pd = raw as Record<string, unknown>
  const path = str(pd.path, '')
  if (pd.emptyPath === true || isEmptyPathContent(path)) return emptyPathData()
  const out: PathData = {
    exists: pd.exists !== false,
    markedBBox: pd.markedBBox === true,
    path,
    width: num(pd.width, 0),
    height: num(pd.height, 0),
    bbox: parseBBox(pd.bbox)
  }
  if (pd.fit && typeof pd.fit === 'object') out.fit = pd.fit as PathData['fit']
  return out
}

export function parseFamilyTransforms(raw: unknown): ResolvedTransforms {
  const t = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const out = { ...DEFAULT_TRANSFORMS }
  for (const k of Object.keys(DEFAULT_TRANSFORMS) as (keyof ResolvedTransforms)[]) {
    const def = DEFAULT_TRANSFORMS[k]
    ;(out as Record<string, unknown>)[k] = typeof def === 'boolean' ? bool(t[k], def) : num(t[k], def as number)
  }
  return out
}

export function parseVariantTransforms(raw: unknown): TransformSettings {
  const t = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const out = parseFamilyTransforms(t) as unknown as TransformSettings
  for (const k of NULLABLE_TRANSFORM_KEYS) {
    if (t[k] === null) out[k] = null
  }
  return out
}

export function parseLayer(raw: LayerData): Layer {
  const v = (raw?.values ?? {}) as Record<string, unknown>
  const d = createLayer()
  return {
    path: parsePathData(v.path),
    inverted: bool(v.inverted, d.inverted),
    characterRef: str(v['lyr-char'], ''),
    customId: typeof v['lyr-id'] === 'string' && v['lyr-id'] !== '' ? (v['lyr-id'] as string) : null,
    isControlLayer: bool(v['lyr-control'], d.isControlLayer),
    doExport: bool(v['do-export'], d.doExport),
    inheritPreviousBounds: bool(v['lyr-bounds-lyr'], d.inheritPreviousBounds),
    layerBounds: num(v.bounds, d.layerBounds),
    contextBounds: num(v['lyr-bounds'], d.contextBounds),
    layerScale: num(v['lyr-scale'], d.layerScale),
    layerScaleFactor: num(v['lyr-scale-factor'], d.layerScaleFactor),
    normFactor: num(v['nrm-factor'], d.normFactor),
    contextAnchor: num(v.anchor, d.contextAnchor),
    layerAnchor: num(v['lyr-anchor'], d.layerAnchor),
    xOffset: num(v.xoffset, d.xOffset),
    yOffset: num(v.yoffset, d.yOffset),
    mirror: num(v.mirror, d.mirror),
    skewRotOrder: num(v['skew-rot-order'], d.skewRotOrder),
    rotation: num(v.rot, d.rotation),
    rotationAnchor: num(v['rot-anchor'], d.rotationAnchor),
    skewX: num(v['skew-x'], d.skewX),
    skewY: num(v['skew-y'], d.skewY),
    expanded: raw?.expanded === true
  }
}

export function parseVariant(raw: VariantData): Variant {
  const v = (raw?.values ?? {}) as Record<string, unknown>
  const nullableNum = (x: unknown): number | null => (typeof x === 'number' && isFinite(x) ? x : null)
  return {
    width: nullableNum(v.width),
    height: nullableNum(v.height),
    pathData: parsePathData(v['path-data']),
    doExport: bool(v['do-export'], bool(v['export-glyph'], true)),
    flattenLayers: bool(v['flatten-layers'], false),
    flattenMode: num(v['flatten-mode'], 1),
    transforms: parseVariantTransforms(raw?.transforms),
    layers: Array.isArray(raw?.layers) ? raw.layers.map(parseLayer) : []
  }
}

export function parseGlyph(raw: GlyphData): Glyph | null {
  const rawKey = raw?.values?.unicode
  if (typeof rawKey !== 'string' || rawKey.trim() === '') return null
  const unicode = normalizeKey(rawKey)
  const variants = Array.isArray(raw.variants) && raw.variants.length > 0 ? raw.variants.map(parseVariant) : []
  if (variants.length === 0) return null
  return {
    unicode,
    name: str(raw.values.name, ''),
    isLigature: raw.isLiga === true || unicode.includes('+'),
    variants
  }
}

function parseSelections(raw: unknown): SelectionPreset[] {
  const out: SelectionPreset[] = Array(10).fill(null)
  if (!Array.isArray(raw)) return out
  for (let i = 0; i < 10; i++) {
    const s = raw[i]
    if (Array.isArray(s)) {
      const keys = s.filter((k): k is string => typeof k === 'string').map(normalizeKey)
      out[i] = keys.length ? keys : null
    }
  }
  return out
}

/** A glyph key: hex code points, '+'-joined for ligatures. */
const GLYPH_KEY = /^[0-9a-f]{4,6}(\+[0-9a-f]{4,6})*$/

/** v2 kerning entries ([left, right, value]); malformed ones are skipped. */
export function parseKerning(raw: unknown): Kerning {
  const out: Kerning = new Map()
  if (!Array.isArray(raw)) return out
  for (const e of raw) {
    if (!Array.isArray(e) || typeof e[0] !== 'string' || typeof e[1] !== 'string' || typeof e[2] !== 'number' || !isFinite(e[2])) continue
    const left = normalizeKey(e[0])
    const right = normalizeKey(e[1])
    if (GLYPH_KEY.test(left) && GLYPH_KEY.test(right)) out.set(pairKey(left, right), e[2])
  }
  return out
}

export interface DeserializeResult {
  family: Family
  glyphs: Map<string, Glyph>
  kerning: Kerning
  inheritKerning: boolean
  meta?: MkFontFile['meta']
}

export function deserializeMkFont(json: string): DeserializeResult {
  let file: MkFontFile
  try {
    file = JSON.parse(json)
  } catch (e) {
    throw new MkFontParseError(msg('document.parse.invalid', { reason: (e as Error).message }))
  }
  const data = file?.data
  if (!data || typeof data !== 'object' || !data.values) {
    throw new MkFontParseError(msg('document.parse.missingData'))
  }

  const defaults = createDefaultFamilyValues()
  const values = { ...defaults } as FamilyValues
  for (const k of Object.keys(defaults) as (keyof FamilyValues)[]) {
    const v = (data.values as unknown as Record<string, unknown>)[k]
    if (v !== undefined) (values as unknown as Record<string, unknown>)[k] = v
  }

  const family: Family = {
    values,
    transforms: parseFamilyTransforms(data.transforms),
    selections: parseSelections(data.selections)
  }

  const glyphs = new Map<string, Glyph>()
  for (const raw of Array.isArray(data.glyphs) ? data.glyphs : []) {
    const glyph = parseGlyph(raw)
    if (glyph) glyphs.set(glyph.unicode, glyph)
  }

  return { family, glyphs, kerning: parseKerning(data.kerning), inheritKerning: data.inheritKerning !== false, meta: file.meta }
}
