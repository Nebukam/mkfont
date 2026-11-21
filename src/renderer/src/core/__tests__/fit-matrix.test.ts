import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import svgpath from 'svgpath'
import { applyAffine, invert, multiply, translation, type Affine } from '../affine'
import { analyzeDependencies, computeAll } from '../compute'
import { deserializeMkFont } from '../deserialize'
import { pathBBox } from '../geometry'
import { DEFAULT_TRANSFORMS, createDefaultFamilyValues, createFamily, createGlyph, createLayer, isEmptyPathContent } from '../model'
import { setGlyphOutline, type DocData } from '../ops'
import { buildFontContext, fitPath, fitPathWithMatrix, reversePath, type SvgStats } from '../transform'
import { FlattenMode, MirrorMode, type Glyph, type PathData, type ResolvedTransforms } from '../../types/font'

const SAMPLE = resolve(__dirname, '../../../public/MkFontExample.mkfont')

/** Lines, a cubic, a quadratic, relative H/V and a second contour: nothing symmetric. */
const RAW = 'M10 20L90 30C100 60 70 110 40 100Q20 90 15 60Z M30 40h20v25h-20z'

/** Every coordinate of a path, absolute, with H/V spelled out. */
function coords(d: string): number[] {
  const out: number[] = []
  svgpath(d)
    .abs()
    .unshort()
    .iterate((seg: (string | number)[], _i: number, x: number, y: number) => {
      const cmd = seg[0] as string
      if (cmd === 'H') out.push(seg[1] as number, y)
      else if (cmd === 'V') out.push(x, seg[1] as number)
      else for (let i = 1; i < seg.length; i++) out.push(seg[i] as number)
    })
  return out
}

function expectSameCoords(a: number[], b: number[], tol = 1e-6): void {
  expect(a.length).toBe(b.length)
  let worst = 0
  for (let i = 0; i < a.length; i++) worst = Math.max(worst, Math.abs(a[i] - b[i]))
  expect(worst).toBeLessThan(tol)
}

const through = (d: string, m: Affine): string => svgpath(d).matrix([...m]).toString()

const pathData = (path: string, width: number, height: number): PathData => ({
  exists: true,
  markedBBox: false,
  path,
  width,
  height,
  bbox: pathBBox(path)
})

describe('affine', () => {
  it('composes and inverts', () => {
    const m: Affine = [2, 0.5, -0.25, 3, 10, -20]
    const inv = invert(m)!
    const [x, y] = applyAffine(multiply(inv, m), 7, -3)
    expect(x).toBeCloseTo(7)
    expect(y).toBeCloseTo(-3)
    expect(applyAffine(multiply(translation(5, 5), m), 1, 1)).toEqual([2 - 0.25 + 10 + 5, 0.5 + 3 - 20 + 5])
    expect(invert([0, 0, 0, 0, 1, 1])).toBeNull()
  })
})

describe('fit matrix', () => {
  const values = createDefaultFamilyValues()
  const ctx = buildFontContext(values, DEFAULT_TRANSFORMS)
  const stats: SvgStats = { path: RAW, width: 120, height: 130, bbox: pathBBox(RAW) }

  it('takes the imported path to the fitted one in every mode', () => {
    const rotSkew: Partial<ResolvedTransforms>[] = [{}]
    for (let order = 0; order < 6; order++) rotSkew.push({ 'skew-rot-order': order, rot: 17, 'skew-x': 8, 'skew-y': -5, 'rot-anchor': order })
    let checked = 0
    for (let bounds = 0; bounds < 4; bounds++)
      for (let mirror = 0; mirror < 4; mirror++)
        for (let scale = 0; scale <= 8; scale++)
          for (const rs of rotSkew)
            for (const anchor of [6, 4, 2])
              for (const halign of [0, 2]) {
                const t: ResolvedTransforms = {
                  ...DEFAULT_TRANSFORMS,
                  bounds,
                  mirror,
                  scale,
                  'scale-factor': 0.7,
                  'nrm-factor': 0.1,
                  anchor,
                  halign,
                  valign: (bounds + anchor) % 5,
                  xshift: 12,
                  xpush: 7,
                  yoffset: -9,
                  ...rs
                }
                const { fit, matrix } = fitPathWithMatrix(t, ctx, stats, 600, 900)
                expect(matrix).not.toBeNull()
                let mine = through(RAW, matrix!)
                if (mirror === MirrorMode.Horizontal || mirror === MirrorMode.Vertical) mine = reversePath(mine)
                expectSameCoords(coords(mine), coords(fit.path))
                checked++
              }
    expect(checked).toBe(4 * 4 * 9 * 7 * 3 * 2)
  })

  it('leaves the fitted path as it was', () => {
    const t: ResolvedTransforms = { ...DEFAULT_TRANSFORMS, rot: 30, mirror: 1 }
    expect(fitPathWithMatrix(t, ctx, stats, 600, 900).fit).toEqual(fitPath(t, ctx, stats, 600, 900))
  })

  it('has no matrix for an empty outline', () => {
    const empty: SvgStats = { path: 'M 0 0 L 0 0 z', width: 0, height: 0, bbox: pathBBox(''), emptyPath: true }
    expect(fitPathWithMatrix(DEFAULT_TRANSFORMS, ctx, empty, 600, 900).matrix).toBeNull()
  })
})

describe('own outline matrix', () => {
  it('matches the computed outline of every glyph of the sample font', () => {
    const { family, glyphs } = deserializeMkFont(readFileSync(SAMPLE, 'utf-8'))
    const computed = computeAll(family, glyphs, analyzeDependencies(glyphs))
    let withOutline = 0
    for (const [key, g] of glyphs) {
      const v = g.variants[0]
      const c = computed.get(key)![0]
      if (isEmptyPathContent(v.pathData.path) || v.pathData.emptyPath) {
        expect(c.ownMatrix).toBeNull()
        continue
      }
      expect(c.ownMatrix).not.toBeNull()
      if (v.flattenLayers) continue
      withOutline++
      const mine = pathBBox(through(v.pathData.path, c.ownMatrix!))
      const b = c.base.bbox
      expect(Math.abs(mine.x - b.x) + Math.abs(mine.y - b.y) + Math.abs(mine.width - b.width) + Math.abs(mine.height - b.height)).toBeLessThan(1e-6)
    }
    expect(withOutline).toBeGreaterThan(10)
  })

  it('follows the outline through flattening', () => {
    for (const flattenMode of [FlattenMode.Fit, FlattenMode.Smart]) {
      const family = createFamily()
      const glyphs = new Map<string, Glyph>()
      glyphs.set('0041', createGlyph('0041', family.transforms, { pathData: pathData('M0 0h60v80h-60z', 100, 100) }))
      glyphs.set(
        '0042',
        createGlyph('0042', family.transforms, {
          pathData: pathData(RAW, 120, 130),
          flattenLayers: true,
          flattenMode,
          layers: [createLayer('A', { xOffset: 300 })]
        })
      )
      const c = computeAll(family, glyphs).get('0042')![0]
      expect(c.ownMatrix).not.toBeNull()
      // The own outline comes first in the flattened path.
      const mine = coords(through(RAW, c.ownMatrix!))
      expectSameCoords(mine, coords(c.path).slice(0, mine.length))
      expect(coords(c.path).length).toBeGreaterThan(mine.length)
    }
  })
})

describe('setGlyphOutline', () => {
  const doc = (): DocData => {
    const family = createFamily()
    const glyphs = new Map<string, Glyph>()
    glyphs.set('0041', createGlyph('0041', family.transforms, { pathData: { ...pathData('M0 0h60v80h-60z', 100, 110), markedBBox: true } }))
    return { family, glyphs, kerning: new Map() as DocData['kerning'], inheritKerning: false }
  }

  it('replaces the path, measures it again and keeps the reference box', () => {
    const d = doc()
    expect(setGlyphOutline(d as never, '0041', 'M-10 5L70 5L70 90Z')).toBe(true)
    const pd = d.glyphs.get('0041')!.variants[0].pathData
    expect(pd.path).toBe('M-10 5L70 5L70 90Z')
    expect([pd.width, pd.height, pd.markedBBox]).toEqual([100, 110, true])
    expect([pd.bbox.x, pd.bbox.y, pd.bbox.width, pd.bbox.height]).toEqual([-10, 5, 80, 85])
    expect(pd.emptyPath).toBeUndefined()
  })

  it('turns an outline with nothing left into the empty placeholder', () => {
    const d = doc()
    setGlyphOutline(d as never, '0041', '')
    expect(d.glyphs.get('0041')!.variants[0].pathData.emptyPath).toBe(true)
  })

  it('ignores a glyph that is not in the font, and a path that is the one it has', () => {
    const d = doc()
    expect(setGlyphOutline(d as never, '0042', 'M0 0L1 1Z')).toBe(false)
    const before = d.glyphs.get('0041')!.variants[0].pathData
    expect(setGlyphOutline(d as never, '0041', before.path)).toBe(false)
    expect(d.glyphs.get('0041')!.variants[0].pathData).toBe(before)
  })
})
