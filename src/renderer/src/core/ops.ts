// ============================================================
// Editing operations — v1 commands as pure draft mutations.
//
// Each function mutates an immer draft of the document. They are
// composed inside `transact()` so a whole command is one undo step.
// ============================================================

import type { Draft } from 'immer'
import type { Family, FamilyValues, Glyph, Layer, ResolvedTransforms, TransformSettings, Variant } from '../types/font'
import { Anchor, BoundsMode, ScaleMode } from '../types/font'
import type { ComputedMap } from './compute'
import { LAYER_LIMIT, RESAMPLED_TRANSFORM_KEYS, createGlyph, createLayer, emptyPathData, isEmptyPathContent, resampleVariantInPlace } from './model'
import { getComposition } from './unicode'
import { charsToKey, keyToChars, refToKey } from './unicode-keys'
import { svgImportToPathData, type SvgImport } from './import-svg'
import { pathBBox } from './geometry'
import type { Kerning } from './kerning'

export interface DocData {
  family: Family
  glyphs: Map<string, Glyph>
  /** Kerning pairs (pair key → value in font units). */
  kerning: Kerning
  /** Accented letters follow the kerning of their base letter (Á uses A's pairs). */
  inheritKerning: boolean
}

export type DocDraft = Draft<DocData>

type DVariant = Draft<Variant>
type DGlyph = Draft<Glyph>

function variantOf(d: DocDraft, key: string, vi = 0): DVariant | undefined {
  return d.glyphs.get(key)?.variants[vi]
}

// ---- Glyph creation / deletion ----------------------------------

/** v1 SHARED_OPS.CreateEmptyGlyph: fixed family width, no auto width. */
export function createEmptyGlyph(d: DocDraft, key: string): void {
  if (d.glyphs.has(key)) return
  const fam = d.family as Family
  const g = createGlyph(key, fam.transforms as ResolvedTransforms, { width: fam.values.width })
  g.variants[0].transforms['auto-w'] = false
  d.glyphs.set(key, g)
}

export function createEmptyGlyphs(d: DocDraft, keys: Iterable<string>): number {
  let n = 0
  for (const k of keys) {
    if (!d.glyphs.has(k)) {
      createEmptyGlyph(d, k)
      n++
    }
  }
  return n
}

export function deleteGlyphs(d: DocDraft, keys: Iterable<string>): number {
  let n = 0
  for (const k of keys) if (d.glyphs.delete(k)) n++
  return n
}

// ---- Variant edits ------------------------------------------------

export function setVariantValues(d: DocDraft, keys: Iterable<string>, values: Partial<Variant>, vi = 0): void {
  for (const k of keys) {
    const v = variantOf(d, k, vi)
    if (v) Object.assign(v, values)
  }
}

export function setTransforms(d: DocDraft, keys: Iterable<string>, values: Partial<TransformSettings>, vi = 0): void {
  for (const k of keys) {
    const v = variantOf(d, k, vi)
    if (v) Object.assign(v.transforms, values)
  }
}

export function renameGlyph(d: DocDraft, key: string, name: string): void {
  const g = d.glyphs.get(key)
  if (g) g.name = name
}

// ---- Layers -------------------------------------------------------

export function addLayer(d: DocDraft, key: string, init: Partial<Layer> = {}, index = -1, vi = 0): boolean {
  const v = variantOf(d, key, vi)
  if (!v || v.layers.length >= LAYER_LIMIT) return false
  const layer = createLayer(init.characterRef ?? '', {
    contextBounds: v.transforms.bounds,
    ...init
  })
  if (index < 0 || index >= v.layers.length) v.layers.push(layer)
  else v.layers.splice(index, 0, layer)
  return true
}

/** v1 LayersAddUInfos: one layer per picked character. */
export function addLayersForChars(d: DocDraft, keys: Iterable<string>, refs: string[], vi = 0): number {
  let n = 0
  for (const k of keys) {
    for (const ref of refs) if (addLayer(d, k, { characterRef: ref, expanded: false }, -1, vi)) n++
  }
  return n
}

export function removeLayer(d: DocDraft, key: string, index: number, vi = 0): void {
  const v = variantOf(d, key, vi)
  if (v && index >= 0 && index < v.layers.length) v.layers.splice(index, 1)
}

/** The glyph for `key`, created (with these transforms, or the font's) when missing. */
export function ensureGlyph(d: DocDraft, key: string, transforms: ResolvedTransforms = d.family.transforms as ResolvedTransforms): DGlyph {
  let g = d.glyphs.get(key)
  if (!g) {
    d.glyphs.set(key, createGlyph(key, transforms))
    g = d.glyphs.get(key)!
  }
  return g
}

/** One component per `<text>` label of an imported SVG (v1), skipping characters the glyph already uses. */
export function addLabelComponents(d: DocDraft, key: string, labels: readonly string[]): void {
  for (const name of labels) {
    const ref = refToKey(name)
    const v = variantOf(d, key)
    if (ref && v && !v.layers.some((l) => refToKey(l.characterRef) === ref)) addLayer(d, key, { characterRef: name, expanded: false })
  }
}

/**
 * Put an imported SVG's outline in a glyph, plus its label components.
 * `create: false` leaves missing glyphs alone (live reload of a bound file).
 */
export function applySvgImport(d: DocDraft, key: string, svg: SvgImport, opts: { create?: boolean } = {}): boolean {
  const g = opts.create === false ? d.glyphs.get(key) : ensureGlyph(d, key)
  if (!g) return false
  g.variants[0].pathData = svgImportToPathData(svg)
  addLabelComponents(d, key, svg.layers ?? [])
  return true
}

/**
 * Replace a glyph's own outline, edited in place. The path stays in the space it was imported
 * in: its reference box (`width` / `height`) is kept, and its bounds are measured again because
 * the fit relies on them. An outline with nothing left becomes the empty placeholder.
 * The same path as before changes nothing (and is no history step).
 */
export function setGlyphOutline(d: DocDraft, key: string, path: string, vi = 0): boolean {
  const v = variantOf(d, key, vi)
  if (!v || v.pathData.path === path) return false
  if (isEmptyPathContent(path) && (v.pathData.emptyPath || isEmptyPathContent(v.pathData.path))) return false
  if (isEmptyPathContent(path)) {
    v.pathData = emptyPathData()
    return true
  }
  const { width, height, markedBBox } = v.pathData
  v.pathData = { exists: true, markedBBox, path, width, height, bbox: pathBBox(path) }
  return true
}

export function moveLayer(d: DocDraft, key: string, from: number, to: number, vi = 0): void {
  const v = variantOf(d, key, vi)
  if (!v || from === to || from < 0 || to < 0 || from >= v.layers.length || to >= v.layers.length) return
  const [l] = v.layers.splice(from, 1)
  v.layers.splice(to, 0, l)
}

export function setLayerValues(d: DocDraft, key: string, index: number, values: Partial<Layer>, vi = 0): void {
  const v = variantOf(d, key, vi)
  const l = v?.layers[index]
  if (!l) return
  if (values.isControlLayer === true) {
    // v1 ActionSetLayerControl: a single control layer per variant.
    v!.layers.forEach((other, i) => {
      if (i !== index) other.isControlLayer = false
    })
  }
  Object.assign(l, values)
}

/** Apply values to every layer of the given glyphs (batch edits, v1 "show/hide all"). */
export function setAllLayers(d: DocDraft, keys: Iterable<string>, values: Partial<Layer>, vi = 0): void {
  for (const k of keys) {
    const v = variantOf(d, k, vi)
    if (v) for (const l of v.layers) Object.assign(l, values)
  }
}

/** Apply values to layers matching a custom id or character (multi-selection layer edits). */
/**
 * The same component across several glyphs (multi-selection): the same custom id,
 * or the same character among components without a custom id.
 */
export interface LayerMatch {
  characterRef?: string
  customId?: string | null
}

export function layerMatches(l: Layer, match: LayerMatch): boolean {
  return match.customId
    ? l.customId === match.customId
    : match.characterRef !== undefined && !l.customId && l.characterRef === match.characterRef
}

/** The group a component belongs to across glyphs: a stable id and its matcher. */
export function layerGroupOf(l: Layer): { id: string; match: LayerMatch } {
  return l.customId ? { id: `#${l.customId}`, match: { customId: l.customId } } : { id: `c:${l.characterRef}`, match: { characterRef: l.characterRef } }
}

export function removeMatchingLayers(d: DocDraft, keys: Iterable<string>, match: LayerMatch, vi = 0): void {
  for (const k of keys) {
    const v = variantOf(d, k, vi)
    if (!v) continue
    for (let i = v.layers.length - 1; i >= 0; i--) if (layerMatches(v.layers[i] as Layer, match)) v.layers.splice(i, 1)
  }
}

export function setMatchingLayers(d: DocDraft, keys: Iterable<string>, match: LayerMatch, values: Partial<Layer>, vi = 0): void {
  const matches = (l: Layer): boolean => layerMatches(l, match)
  for (const k of keys) {
    const v = variantOf(d, k, vi)
    if (!v) continue
    let controlGiven = false
    for (const l of v.layers) {
      if (!matches(l as Layer)) continue
      const vals = { ...values }
      // A single control component per glyph: the first match gets it.
      if (values.isControlLayer === true) {
        if (controlGiven) vals.isControlLayer = false
        controlGiven = true
      }
      Object.assign(l, vals)
    }
    if (controlGiven) for (const l of v.layers) if (!matches(l as Layer)) l.isControlLayer = false
  }
}

function findLayer(v: DVariant, char: string, uni: string): number {
  return v.layers.findIndex((l) => l.characterRef === char || l.characterRef === uni)
}

/**
 * v1 SHARED_OPS.BoostrapComp: create components from the Unicode decomposition.
 * Missing component glyphs are created (and bootstrapped) when `createMissing`.
 */
export function bootstrapComposition(
  d: DocDraft,
  key: string,
  computed: ComputedMap,
  createMissing = true,
  visited = new Set<string>()
): number {
  if (visited.has(key)) return 0
  visited.add(key)
  const comp = getComposition(key)
  const target = variantOf(d, key)
  if (!comp || !target) return 0

  let created = 0
  const hasLayersAlready = target.layers.length > 0
  let doControl = !hasLayersAlready
  let maxw = 0

  if (createMissing) {
    for (const c of comp) {
      if (!d.glyphs.has(c)) {
        createEmptyGlyph(d, c)
        created++
        created += bootstrapComposition(d, c, computed, true, visited)
      }
    }
  }

  comp.forEach((c, i) => {
    const ch = keyToChars(c)
    if (target.layers.length >= LAYER_LIMIT) return
    if (findLayer(target, ch, `U+${c}`) !== -1) return
    const init: Partial<Layer> = {
      characterRef: ch,
      isControlLayer: false,
      contextBounds: BoundsMode.MixedVertical,
      contextAnchor: Anchor.Bottom,
      layerBounds: BoundsMode.Outside,
      layerAnchor: Anchor.Bottom,
      expanded: false
    }
    if (doControl) {
      init.isControlLayer = i === 0
      init.layerBounds = BoundsMode.MixedVertical
      init.contextAnchor = Anchor.BottomLeft
      init.layerAnchor = Anchor.BottomLeft
      doControl = false
    }
    target.layers.push(createLayer(ch, init))
    const g = d.glyphs.get(c)
    if (g) {
      const w = computed.get(c)?.[0]?.exportedWidth ?? g.variants[0].width ?? (d.family as Family).values.width
      maxw = Math.max(maxw, w)
    }
  })

  if (!hasLayersAlready && maxw) {
    target.transforms['auto-w'] = false
    target.width = maxw
  }
  return created
}

/**
 * v1 CmdGlyphClear._Empty: reset glyphs to an empty path.
 * @param keepLayers v1 [Alt]: keep existing components
 * @param bootstrap v1 [Shift]: create components from the decomposition
 */
export function resetGlyphs(
  d: DocDraft,
  keys: Iterable<string>,
  computed: ComputedMap,
  opts: { keepLayers?: boolean; bootstrap?: boolean } = {}
): void {
  const fam = d.family as Family
  for (const k of keys) {
    const v = variantOf(d, k)
    if (!v) {
      createEmptyGlyph(d, k)
      if (opts.bootstrap) bootstrapComposition(d, k, computed, true)
      continue
    }
    v.width = fam.values.width
    v.pathData = emptyPathData()
    v.transforms['auto-w'] = false
    if (!opts.keepLayers) v.layers.splice(0, v.layers.length)
    if (opts.bootstrap) bootstrapComposition(d, k, computed, true)
  }
}

// ---- Ligatures ------------------------------------------------------

/** v1 CmdImportLigatures: create empty ligature glyphs for strings. */
export function createLigatures(d: DocDraft, strings: string[]): string[] {
  const fam = d.family as Family
  const created: string[] = []
  for (const s of strings) {
    if (Array.from(s).length < 2) continue
    const key = charsToKey(s)
    if (d.glyphs.has(key)) continue
    const g = createGlyph(key, fam.transforms as ResolvedTransforms, { width: fam.values.width })
    g.variants[0].transforms['auto-w'] = false
    d.glyphs.set(key, g)
    created.push(key)
  }
  return created
}

/**
 * v1 CmdLigatureFromSelection: create a ligature from a sequence of keys.
 * With `withComponents`, one layer per character is chained left to right.
 */
export function createLigatureFromKeys(d: DocDraft, keys: string[], withComponents: boolean): string | null {
  const parts: string[] = []
  for (const k of keys) parts.push(...k.split('+'))
  if (parts.length < 2) return null
  const ligKey = parts.join('+')
  if (d.glyphs.has(ligKey)) return ligKey
  const fam = d.family as Family
  const g = createGlyph(ligKey, fam.transforms as ResolvedTransforms, { width: fam.values.width })
  g.variants[0].transforms['auto-w'] = true
  d.glyphs.set(ligKey, g)
  if (withComponents) {
    const v = d.glyphs.get(ligKey)!.variants[0]
    v.flattenLayers = true
    v.transforms.scale = ScaleMode.Manual
    v.transforms['scale-factor'] = 1
    parts.forEach((p, i) => {
      if (v.layers.length >= LAYER_LIMIT) return
      v.layers.push(
        createLayer(keyToChars(p), {
          layerBounds: BoundsMode.Outside,
          contextBounds: BoundsMode.Outside,
          contextAnchor: i === 0 ? Anchor.BottomLeft : Anchor.BottomRight,
          layerAnchor: Anchor.BottomLeft,
          inheritPreviousBounds: i !== 0,
          expanded: false
        })
      )
    })
  }
  return ligKey
}

// ---- Kerning --------------------------------------------------------

/** Set pair values (adds the pairs that are new). */
export function setKerning(d: DocDraft, entries: Iterable<readonly [string, number]>): void {
  for (const [key, value] of entries) if (isFinite(value)) d.kerning.set(key, value)
}

export function removeKerning(d: DocDraft, keys: Iterable<string>): number {
  let n = 0
  for (const k of keys) if (d.kerning.delete(k)) n++
  return n
}

export function setInheritKerning(d: DocDraft, inherit: boolean): void {
  d.inheritKerning = inherit
}

// ---- Family metrics -------------------------------------------------

const FAMILY_RESAMPLE: (keyof FamilyValues)[] = ['baseline', 'ascent', 'descent', 'width', 'height', 'x-height', 'cap-height']

function scaleNum<T extends Record<string, unknown>>(obj: T, key: keyof T, factor: number): void {
  const v = obj[key]
  if (typeof v === 'number') (obj as Record<string, unknown>)[key as string] = v * factor
}

/** v1 ActionSetEM with resample: scale every metric-bearing value. */
export function resampleFont(d: DocDraft, factor: number): void {
  if (factor === 1 || !isFinite(factor) || factor <= 0) return
  const fam = d.family
  for (const k of FAMILY_RESAMPLE) scaleNum(fam.values as unknown as Record<string, unknown>, k, factor)
  for (const k of RESAMPLED_TRANSFORM_KEYS) scaleNum(fam.transforms as unknown as Record<string, unknown>, k, factor)
  for (const g of d.glyphs.values()) for (const v of g.variants) resampleVariantInPlace(v as Variant, factor)
  for (const [k, v] of d.kerning) d.kerning.set(k, v * factor)
}

/**
 * Update family values, applying v1's EM and ascent resampling rules.
 */
export function setFamilyValues(d: DocDraft, values: Partial<FamilyValues>): void {
  const fam = d.family
  const prev = fam.values
  if (values.em !== undefined && values.em !== prev.em && prev.em > 0 && (values['em-resample'] ?? prev['em-resample'])) {
    resampleFont(d, values.em / prev.em)
  }
  if (values.ascent !== undefined && values.ascent !== prev.ascent && prev.ascent !== 0 && (values['asc-resample'] ?? prev['asc-resample'])) {
    const f = values.ascent / prev.ascent
    fam.values['x-height'] *= f
    fam.values['cap-height'] *= f
  }
  Object.assign(fam.values, values)
}

export function setFamilyTransforms(d: DocDraft, values: Partial<ResolvedTransforms>): void {
  Object.assign(d.family.transforms, values)
}
