// ============================================================
// Glyph composition — port of v1 TransformSettingsDataBlock.UpdateTransform
// plus dependency tracking (layer references, circularity, users).
// ============================================================

import svgpath from 'svgpath'
import type { Family, Glyph, Variant } from '../types/font'
import { FlattenMode } from '../types/font'
import { makeBBox, pathBBox } from './geometry'
import { multiply, translation, type Affine } from './affine'
import { EMPTY_PATH_CONTENT, OOB_LIMIT, isEmptyPathContent, resolveTransforms } from './model'
import {
  buildFontContext,
  fitLayerPathWithMatrix,
  fitPathWithMatrix,
  reversePath,
  statsFromPathData,
  type FitResult,
  type FontContext,
  type SvgStats
} from './transform'
import { refToKey } from './unicode-keys'

export interface LayerComputed {
  /** Key resolved from the layer's character reference. */
  refKey: string | null
  /** Whether the referenced glyph exists in the font. */
  exists: boolean
  /** The reference loops back to the host glyph. */
  circular: boolean
  /** Placed layer geometry, or null when the layer was skipped. */
  fit: FitResult | null
  /** The matrix from the referenced glyph's path to `fit.path`; null when skipped. */
  matrix: Affine | null
}

export interface VariantComputed {
  /** v1 `_computedPath`: own fit, or the flattened fit. */
  base: FitResult
  /** Fit used as the default layer context (own fit or control layer's base). */
  context: FitResult
  /** v1 `PATH`: final concatenated path (EMPTY_PATH_CONTENT when empty). */
  path: string
  /**
   * Where the glyph's own imported outline lands in `path`: the matrix from
   * `pathData.path` to font units. Null when the glyph has no outline of its own.
   */
  ownMatrix: Affine | null
  /**
   * Where the placed layers (`layers[i].fit`) land in `path` when the variant is
   * flattened, which fits the whole again. Null when they are in `path` as placed.
   */
  flatMatrix: Affine | null
  /** v1 `EXPORTED_WIDTH` (before monospace override). */
  exportedWidth: number
  /** Resolved height (variant height or family height). */
  height: number
  layers: LayerComputed[]
  /** Index of the active control layer, -1 if none. */
  controlIndex: number
  empty: boolean
  oob: boolean
}

export type ComputedMap = Map<string, VariantComputed[]>

export interface DependencyInfo {
  /** Per glyph, per variant, per layer: resolved reference info. */
  layerRefs: Map<string, { refKey: string | null; exists: boolean; circular: boolean }[][]>
  /** ref key → glyph keys whose layers reference it (existing or not). */
  users: Map<string, Set<string>>
  /** Topological compute order (references before users). */
  order: string[]
}

// --- Dependency analysis ---

export function analyzeDependencies(glyphs: Map<string, Glyph>): DependencyInfo {
  const layerRefs: DependencyInfo['layerRefs'] = new Map()
  const users: DependencyInfo['users'] = new Map()
  /** Active-variant edges used for circularity checks (v1 traverses importedVariant layers). */
  const activeEdges = new Map<string, string[]>()

  for (const [key, glyph] of glyphs) {
    const perVariant: { refKey: string | null; exists: boolean; circular: boolean }[][] = []
    glyph.variants.forEach((variant, vi) => {
      const refs = variant.layers.map((layer) => {
        const refKey = refToKey(layer.characterRef)
        const exists = refKey !== null && glyphs.has(refKey)
        if (refKey) {
          let set = users.get(refKey)
          if (!set) users.set(refKey, (set = new Set()))
          set.add(key)
        }
        return { refKey, exists, circular: false }
      })
      perVariant.push(refs)
      if (vi === 0) {
        activeEdges.set(
          key,
          refs.filter((r) => r.exists).map((r) => r.refKey as string)
        )
      }
    })
    layerRefs.set(key, perVariant)
  }

  // Circularity: a layer is circular if its reference (transitively) reaches the host's active variant.
  const reachCache = new Map<string, Set<string>>()
  const reachable = (start: string): Set<string> => {
    const cached = reachCache.get(start)
    if (cached) return cached
    const seen = new Set<string>()
    const stack = [start]
    while (stack.length) {
      const k = stack.pop()!
      if (seen.has(k)) continue
      seen.add(k)
      for (const next of activeEdges.get(k) ?? []) if (!seen.has(next)) stack.push(next)
    }
    reachCache.set(start, seen)
    return seen
  }

  for (const [key, perVariant] of layerRefs) {
    perVariant.forEach((refs, vi) => {
      for (const r of refs) {
        if (!r.exists || !r.refKey) continue
        if (vi === 0) r.circular = r.refKey === key || reachable(r.refKey).has(key)
      }
    })
  }

  // Topological order over non-circular edges (Kahn).
  const deps = new Map<string, Set<string>>()
  const rev = new Map<string, Set<string>>()
  for (const [key, perVariant] of layerRefs) {
    const d = new Set<string>()
    for (const refs of perVariant) {
      for (const r of refs) {
        if (r.exists && !r.circular && r.refKey && r.refKey !== key) d.add(r.refKey)
      }
    }
    deps.set(key, d)
    for (const dk of d) {
      let s = rev.get(dk)
      if (!s) rev.set(dk, (s = new Set()))
      s.add(key)
    }
  }
  const inDeg = new Map<string, number>()
  for (const [key, d] of deps) inDeg.set(key, d.size)
  const queue: string[] = []
  for (const [key, n] of inDeg) if (n === 0) queue.push(key)
  const order: string[] = []
  const placed = new Set<string>()
  for (let qi = 0; qi < queue.length; qi++) {
    const k = queue[qi]
    order.push(k)
    placed.add(k)
    for (const u of rev.get(k) ?? []) {
      const n = (inDeg.get(u) ?? 1) - 1
      inDeg.set(u, n)
      if (n === 0) queue.push(u)
    }
  }
  // Leftovers belong to dependency loops through non-active variants; compute them last.
  for (const key of glyphs.keys()) if (!placed.has(key)) order.push(key)

  return { layerRefs, users, order }
}

/**
 * True when two versions of a glyph reference the same components in the same
 * layer slots: their dependency info is then identical (it reads nothing else).
 */
export function sameComponentRefs(a: Glyph, b: Glyph): boolean {
  if (a.variants.length !== b.variants.length) return false
  for (let vi = 0; vi < a.variants.length; vi++) {
    const la = a.variants[vi].layers
    const lb = b.variants[vi].layers
    if (la === lb) continue
    if (la.length !== lb.length) return false
    for (let i = 0; i < la.length; i++) if (la[i].characterRef !== lb[i].characterRef) return false
  }
  return true
}

/** All glyph keys that (transitively) use any of the given keys as a component. */
export function collectDependents(dep: DependencyInfo, keys: Iterable<string>): Set<string> {
  const out = new Set<string>()
  const stack = [...keys]
  while (stack.length) {
    const k = stack.pop()!
    for (const u of dep.users.get(k) ?? []) {
      if (!out.has(u)) {
        out.add(u)
        stack.push(u)
      }
    }
  }
  return out
}

// --- Variant composition ---

/** v1 SVGOPS.FlatSVGStats */
function flatSvgStats(path: string, own: FitResult, flattenMode: number): { stats: SvgStats; shift: Affine } {
  if (isEmptyPathContent(path)) {
    return {
      stats: { path: EMPTY_PATH_CONTENT, width: 0, height: 0, bbox: makeBBox(0, 0, 0, 0), emptyPath: true },
      shift: translation(0, 0)
    }
  }
  const bbox = pathBBox(path)
  const fit = own.fit
  const outW = bbox.width
  let outH = bbox.height
  let dy = -bbox.y
  if (fit && flattenMode === FlattenMode.Smart) {
    outH = fit.height
    dy = fit.y
  }
  const out = svgpath(path).translate(-bbox.x, dy).toString()
  return { stats: { width: outW, height: outH, path: out, bbox: pathBBox(out) }, shift: translation(-bbox.x, dy) }
}

export function computeVariant(
  variant: Variant,
  family: Family,
  ctx: FontContext,
  refs: { refKey: string | null; exists: boolean; circular: boolean }[],
  computed: ComputedMap
): VariantComputed {
  const fam = family.values
  const t = resolveTransforms(variant.transforms, family.transforms)
  const ctxW = variant.width ?? fam.width
  const ctxH = variant.height ?? fam.height
  const rw = variant.width ?? fam.width
  const autoW = t['auto-w']

  const ownFit = fitPathWithMatrix(t, ctx, statsFromPathData(variant.pathData), ctxW, ctxH)
  const own = ownFit.fit
  let ownMatrix = ownFit.matrix
  let refPath: FitResult = own
  let w: number

  // v1: the last layer flagged as control wins.
  let controlIndex = -1
  variant.layers.forEach((l, i) => {
    if (l.isControlLayer) controlIndex = i
  })
  let controlComp: VariantComputed | undefined
  if (controlIndex >= 0) {
    const r = refs[controlIndex]
    if (r && r.exists && !r.circular && r.refKey) controlComp = computed.get(r.refKey)?.[0]
  }

  if (controlComp) {
    w = controlComp.exportedWidth
    refPath = controlComp.base
  } else if (variant.flattenLayers) {
    w = rw
  } else {
    w = autoW ? own.width : rw
  }

  const b = own.bbox
  let bbmin = Math.min(b.left, b.right, b.top, b.bottom)
  let bbmax = Math.max(b.left, b.right, b.top, b.bottom)

  const layers: LayerComputed[] = []
  let lastLayer: FitResult | null = null

  variant.layers.forEach((layer, i) => {
    const r = refs[i] ?? { refKey: null, exists: false, circular: false }
    const refComp = r.exists && r.refKey ? computed.get(r.refKey)?.[0] : undefined
    let fit: FitResult | null = null
    let matrix: Affine | null = null
    if (refComp && !r.circular && layer.doExport) {
      const layerPath = layer.inverted ? reversePath(refComp.path) : refComp.path
      const context = layer.inheritPreviousBounds && lastLayer ? lastLayer : refPath
      const placed = fitLayerPathWithMatrix(layer, context, refComp.base, layerPath)
      fit = placed.fit
      matrix = placed.matrix
      lastLayer = fit
      const bb = fit.bbox
      bbmin = Math.min(bbmin, bb.left, bb.right, bb.top, bb.bottom)
      bbmax = Math.max(bbmax, bb.left, bb.right, bb.top, bb.bottom)
    }
    layers.push({ refKey: r.refKey, exists: r.exists, circular: r.circular, fit, matrix })
  })

  // v1 GlyphVariantDataBlock._ConcatPaths
  let path = isEmptyPathContent(own.path) ? '' : own.path
  for (const l of layers) {
    if (l.fit && !isEmptyPathContent(l.fit.path)) path += ' ' + l.fit.path
  }
  if (path.trim() === '') path = EMPTY_PATH_CONTENT

  let base = own
  let flatMatrix: Affine | null = null
  if (variant.flattenLayers) {
    const flat = flatSvgStats(path, own, variant.flattenMode)
    const flatFit = fitPathWithMatrix(t, ctx, flat.stats, ctxW, ctxH)
    path = flatFit.fit.path
    w = autoW ? flatFit.fit.width : rw
    base = flatFit.fit
    // The own outline is fitted, moved with the flattened whole, then fitted again.
    flatMatrix = flatFit.matrix ? multiply(flatFit.matrix, flat.shift) : null
    ownMatrix = ownMatrix && flatMatrix ? multiply(flatMatrix, ownMatrix) : null
  }

  const oob = bbmin < -OOB_LIMIT || bbmax < -OOB_LIMIT || bbmin > OOB_LIMIT || bbmax > OOB_LIMIT

  return {
    base,
    context: refPath,
    path,
    ownMatrix,
    flatMatrix,
    exportedWidth: w,
    height: ctxH,
    layers,
    controlIndex: controlComp ? controlIndex : -1,
    empty: isEmptyPathContent(path),
    oob
  }
}

export function computeGlyph(
  glyph: Glyph,
  family: Family,
  ctx: FontContext,
  dep: DependencyInfo,
  computed: ComputedMap
): VariantComputed[] {
  const perVariant = dep.layerRefs.get(glyph.unicode) ?? []
  return glyph.variants.map((v, vi) => computeVariant(v, family, ctx, perVariant[vi] ?? [], computed))
}

/** Compute every glyph. */
export function computeAll(family: Family, glyphs: Map<string, Glyph>, dep = analyzeDependencies(glyphs)): ComputedMap {
  const ctx = buildFontContext(family.values, family.transforms)
  const out: ComputedMap = new Map()
  for (const key of dep.order) {
    const glyph = glyphs.get(key)
    if (glyph) out.set(key, computeGlyph(glyph, family, ctx, dep, out))
  }
  return out
}

/**
 * Recompute the given glyphs and everything that depends on them.
 * Returns a new map; untouched entries are shared with `prev`.
 */
export function computeIncremental(
  family: Family,
  glyphs: Map<string, Glyph>,
  prev: ComputedMap,
  changed: Iterable<string>,
  dep = analyzeDependencies(glyphs)
): ComputedMap {
  const changedSet = new Set(changed)
  const affected = new Set<string>(changedSet)
  for (const k of collectDependents(dep, changedSet)) affected.add(k)

  const out: ComputedMap = new Map(prev)
  for (const k of affected) if (!glyphs.has(k)) out.delete(k)

  const ctx = buildFontContext(family.values, family.transforms)
  for (const key of dep.order) {
    if (!affected.has(key)) continue
    const glyph = glyphs.get(key)
    if (glyph) out.set(key, computeGlyph(glyph, family, ctx, dep, out))
  }
  return out
}

/** Advance width written to the font (v1 `_UpdateFontObject`). */
export function advanceWidth(c: VariantComputed | undefined, family: Family): number {
  if (family.values.monospace) return family.values.width
  return c ? c.exportedWidth : family.values.width
}
