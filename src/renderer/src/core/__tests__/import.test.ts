// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { parseSvg, variantToSvg, readMkfValues } from '../import-svg'
import { keyFromFilename, detectPrefixSeparator, assignKeys, AssignMode, BlockStart } from '../import-assign'
import { createVariant, DEFAULT_TRANSFORMS } from '../model'
import { tm } from '../../i18n'

describe('SVG parsing', () => {
  it('merges paths and keeps the viewBox size', () => {
    const r = parseSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200"><path d="M10 10H50V50H10Z"/><rect x="60" y="60" width="10" height="10"/></svg>')
    expect(r.exists).toBe(true)
    expect(r.width).toBe(100)
    expect(r.height).toBe(200)
    expect(r.bbox.x).toBeCloseTo(10)
    expect(r.bbox.right).toBeCloseTo(70)
  })

  it('uses a magenta path as the glyph box (fill, stroke, style, class)', () => {
    for (const markup of [
      '<path d="M0 0H40V80H0Z" fill="#FF00FF"/>',
      '<path d="M0 0H40V80H0Z" style="fill:none;stroke:#f0f"/>',
      '<path d="M0 0H40V80H0Z" class="m"/>',
      // rgb() notation, as Affinity writes colors.
      '<path d="M0 0H40V80H0Z" style="fill:rgb(255,0,255);"/>',
      '<path d="M0 0H40V80H0Z" style="fill:none;stroke:rgb(255, 0, 255);stroke-width:1px;"/>',
      '<path d="M0 0H40V80H0Z" fill="rgb(100% 0% 100%)"/>',
      '<path d="M0 0H40V80H0Z" fill="rgba(185,82,159,1)"/>'
    ]) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><style>.m{stroke:#ff00ff;fill:none}</style>${markup}<path d="M10 10H20V20H10Z"/></svg>`
      const r = parseSvg(svg)
      expect(r.markedBBox, markup).toBe(true)
      expect(r.width).toBeCloseTo(40)
      expect(r.height).toBeCloseTo(80)
      expect(r.bbox.x).toBeCloseTo(10)
    }
  })

  it('reads <text> labels as component names', () => {
    const r = parseSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0H5V5Z"/><text>A</text><text>U+0301</text></svg>')
    expect(r.layers).toEqual(['A', 'U+0301'])
  })

  it('honours the viewBox origin and transforms', () => {
    const r = parseSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="100 100 50 50"><g transform="translate(5 5)"><path d="M100 100H110V110H100Z"/></g></svg>')
    expect(r.bbox.x).toBeCloseTo(5)
    expect(r.bbox.y).toBeCloseTo(5)
  })

  it('applies transforms of groups with several children (nested too)', () => {
    const one = parseSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g transform="translate(50 50)"><path d="M0 0H10V10H0Z"/><path d="M20 0H30V10H20Z"/></g></svg>'
    )
    expect(one.bbox.x).toBeCloseTo(50)
    expect(one.bbox.y).toBeCloseTo(50)
    expect(one.bbox.width).toBeCloseTo(30)
    const nested = parseSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g transform="translate(10 0)"><g transform="scale(2)"><path d="M0 0H10V10H0Z"/><path d="M20 0H30V10H20Z"/></g></g></svg>'
    )
    expect(nested.bbox.x).toBeCloseTo(10)
    expect(nested.bbox.width).toBeCloseTo(60)
  })

  it('ignores clip paths, masks and other definitions (Figma exports)', () => {
    const r = parseSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g clip-path="url(#c)"><path d="M4 4h6v6H4Z"/></g><defs><clipPath id="c"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>'
    )
    expect(r.exists).toBe(true)
    expect(r.bbox.x).toBeCloseTo(4)
    expect(r.bbox.width).toBeCloseTo(6)
  })

  it('draws <use> references (Sketch defs, symbols with x / y, transformed groups)', () => {
    const svg = (body: string): string =>
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 200">${body}</svg>`
    const sketch = parseSvg(svg('<defs><path id="p" d="M10 10H90V90H10Z"/></defs><use xlink:href="#p"/>'))
    expect(sketch.exists).toBe(true)
    expect(sketch.bbox.x).toBeCloseTo(10)
    expect(sketch.bbox.width).toBeCloseTo(80)
    const symbol = parseSvg(svg('<defs><symbol id="s"><path d="M0 0H10V10H0Z"/><path d="M20 0H30V10H20Z"/></symbol></defs><use href="#s" x="50" y="20"/>'))
    expect(symbol.bbox.x).toBeCloseTo(50)
    expect(symbol.bbox.y).toBeCloseTo(20)
    expect(symbol.bbox.width).toBeCloseTo(30)
    const group = parseSvg(
      svg('<defs><g id="g" transform="translate(5 0)"><path d="M0 0H10V10H0Z"/><path d="M0 20H10V30H0Z"/></g></defs><use href="#g" transform="translate(100 0)"/>')
    )
    expect(group.bbox.x).toBeCloseTo(105)
  })

  it('follows <use> chains and maps symbol viewBoxes like a browser', () => {
    const svg = (body: string): string =>
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 300 300">${body}</svg>`
    // Inkscape clone of a clone.
    const clones = parseSvg(svg('<defs><path id="p" d="M0 0H10V10H0Z"/></defs><use id="u1" href="#p" x="60"/><use href="#u1" x="100"/>'))
    expect(clones.bbox.x).toBeCloseTo(60)
    expect(clones.bbox.right).toBeCloseTo(170)
    // A group whose only child is a <use> (SVGO moves the group's id onto it).
    const chain = parseSvg(svg('<defs><path id="p" d="M10 10H20V20H10Z"/><g id="g"><use href="#p"/></g></defs><use href="#g" x="100"/>'))
    expect(chain.exists).toBe(true)
    expect(chain.bbox.x).toBeCloseTo(110)
    // Centred registration point.
    const centred = parseSvg(
      svg('<defs><symbol id="s" viewBox="-15 -15 30 30"><path d="M-15 -15H15V15H-15Z"/></symbol></defs><use href="#s" x="-15" y="-15" width="30" height="30" transform="translate(100 100)"/>')
    )
    expect(centred.bbox.x).toBeCloseTo(85)
    expect(centred.bbox.width).toBeCloseTo(30)
    // Scaled instance.
    const scaled = parseSvg(svg('<defs><symbol id="t" viewBox="0 0 10 10"><path d="M0 0H10V10H0Z"/></symbol></defs><use href="#t" width="100" height="100"/>'))
    expect(scaled.bbox.width).toBeCloseTo(100)
    expect(scaled.bbox.height).toBeCloseTo(100)
  })

  it('takes the mark color from the <use> that draws the box', () => {
    const r = parseSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><defs><rect id="r" width="40" height="80"/></defs><use href="#r" stroke="#ff00ff" fill="none"/><path d="M10 10H20V20H10Z"/></svg>'
    )
    expect(r.markedBBox).toBe(true)
    expect(r.width).toBeCloseTo(40)
    expect(r.height).toBeCloseTo(80)
  })

  it('keeps rectangles with an "auto" radius', () => {
    const r = parseSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="40" height="20" rx="auto"/></svg>')
    expect(r.exists).toBe(true)
    expect(r.bbox.x).toBeCloseTo(10)
    expect(r.bbox.width).toBeCloseTo(40)
  })

  it('refuses SVGs that expand to too many copies', () => {
    let defs = '<path id="l0" d="M0 0H1V1H0Z"/>'
    for (let i = 1; i <= 8; i++) defs += `<g id="l${i}">${`<use href="#l${i - 1}"/>`.repeat(10)}</g>`
    const r = parseSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs>${defs}</defs><use href="#l8"/></svg>`)
    expect(r.exists).toBe(false)
    expect(tm(r.error!)).toMatch(/too many copies/)
  })

  it('refuses copies that add up to too much path data, but not many plain paths', () => {
    const segs = 'L1 1'.repeat(1000)
    let defs = `<path id="l0" d="M0 0${segs}Z"/>`
    for (let i = 1; i <= 4; i++) defs += `<g id="l${i}">${`<use href="#l${i - 1}"/>`.repeat(10)}</g>`
    const big = parseSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs>${defs}</defs><use href="#l4"/></svg>`)
    expect(big.exists).toBe(false)
    expect(tm(big.error!)).toMatch(/too much path data/)
    const many = parseSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${'<path d="M1 1H2V2H1Z"/>'.repeat(2000)}</svg>`)
    expect(many.exists).toBe(true)
  })

  it('resolves sizes against the nearest viewport and keeps ids SVGO would drop', () => {
    const wrap = (body: string): string => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${body}</svg>`
    const nested = parseSvg(
      wrap('<defs><symbol id="dot" viewBox="0 0 10 10"><path d="M0 0H10V10H0Z"/></symbol><symbol id="pair" viewBox="0 0 100 100"><use href="#dot" width="100%" height="100%"/></symbol></defs><use href="#pair" width="200" height="200"/>')
    )
    expect(nested.bbox.width).toBeCloseTo(200)
    const styled = parseSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>#p{fill:#000}</style><defs><path id="p" d="M10 10H20V20H10Z"/></defs><use href="#p" x="50"/></svg>')
    expect(styled.exists).toBe(true)
    expect(styled.bbox.x).toBeCloseTo(60)
    const dup = parseSvg(wrap('<defs><path id="p" d="M0 0H10V10H0Z"/><path id="p" d="M100 100H200V200H100Z"/></defs><use href="#p"/>'))
    expect(dup.bbox.width).toBeCloseTo(10)
  })

  it('reads an inherited mark stroke through fill="none", <use> of an <svg>, units and minified transforms', () => {
    const mark = parseSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><defs><rect id="r" width="40" height="80" fill="none"/></defs><use href="#r" stroke="#ff00ff"/><path d="M10 10H20V20H10Z"/></svg>'
    )
    expect(mark.markedBBox).toBe(true)
    expect(mark.width).toBeCloseTo(40)
    const wrap = (body: string): string => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">${body}</svg>`
    const svgUse = parseSvg(wrap('<defs><svg id="ic" viewBox="0 0 10 10" width="10" height="10"><path d="M0 0H10V10H0Z"/></svg></defs><use href="#ic" width="200" height="200"/>'))
    expect(svgUse.bbox.width).toBeCloseTo(200)
    const placedSymbol = parseSvg(wrap('<defs><symbol id="s" x="50" y="30" width="10" height="10" viewBox="0 0 10 10"><path d="M0 0H10V10H0Z"/></symbol></defs><use href="#s"/>'))
    expect(placedSymbol.bbox.x).toBeCloseTo(50)
    expect(placedSymbol.bbox.y).toBeCloseTo(30)
    const units = parseSvg(wrap('<defs><path id="p" d="M0 0H1V1H0Z"/></defs><use href="#p" x="2em" y="+20"/>'))
    expect(units.bbox.x).toBeCloseTo(32)
    expect(units.bbox.y).toBeCloseTo(20)
    const minified = parseSvg(wrap('<g transform="translate(100-50)"><path d="M0 100H10V110H0Z"/><path d="M20 100H30V110H20Z"/></g>'))
    expect(minified.bbox.x).toBeCloseTo(100)
    expect(minified.bbox.y).toBeCloseTo(50)
  })

  it('skips rectangles sized in percent (page backgrounds)', () => {
    const r = parseSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="#fff"/><path d="M10 10H20V20H10Z"/></svg>')
    expect(r.bbox.x).toBeCloseTo(10)
    expect(r.bbox.width).toBeCloseTo(10)
  })

  it('imports rounded rectangles, also as the glyph box', () => {
    const r = parseSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="40" height="20" rx="5"/></svg>')
    expect(r.exists).toBe(true)
    expect(r.bbox.x).toBeCloseTo(10)
    expect(r.bbox.width).toBeCloseTo(40)
    expect(r.bbox.height).toBeCloseTo(20)
    const marked = parseSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="40" height="80" rx="4" fill="#ff00ff"/><path d="M10 10H20V20H10Z"/></svg>'
    )
    expect(marked.markedBBox).toBe(true)
    expect(marked.width).toBeCloseTo(40)
    expect(marked.height).toBeCloseTo(80)
  })

  it('leaves hidden layers and shapes out, but a hidden mark box still sets the glyph box', () => {
    const wrap = (body: string): string => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">${body}</svg>`
    const glyph = '<path d="M10 10H20V20H10Z"/>'
    // Inkscape and Illustrator hidden layers, a hidden class used twice, visibility.
    for (const hidden of [
      '<g style="display:none"><path d="M100 100H400V400H100Z"/><path d="M0 0H5V5H0Z"/></g>',
      '<g display="none"><g><path d="M100 100H400V400H100Z"/></g></g>',
      '<style>.h{display:none}</style><path class="h" d="M100 100H400V400H100Z"/><path class="h" d="M0 0H5V5H0Z"/>',
      '<g visibility="hidden"><path d="M100 100H400V400H100Z"/></g>'
    ]) {
      const r = parseSvg(wrap(hidden + glyph))
      expect(r.bbox.x, hidden).toBeCloseTo(10)
      expect(r.bbox.width, hidden).toBeCloseTo(10)
    }
    const shown = parseSvg(wrap('<g visibility="hidden"><path d="M100 100H400V400H100Z"/><path visibility="visible" d="M0 0H5V5H0Z"/></g>' + glyph))
    expect(shown.bbox.x).toBeCloseTo(0)
    expect(shown.bbox.right).toBeCloseTo(20)
    // A <use> copy only takes the style of the <use>, not of the hidden layer holding the original.
    const viaUse = parseSvg(wrap('<g style="display:none"><path id="p" d="M30 30H40V40H30Z"/></g><use href="#p"/>' + glyph))
    expect(viaUse.bbox.right).toBeCloseTo(40)
    const mark = parseSvg(wrap('<g style="display:none"><path d="M0 0H40V80H0Z" fill="none" stroke="#f0f"/></g>' + glyph))
    expect(mark.markedBBox).toBe(true)
    expect(mark.width).toBeCloseTo(40)
    expect(mark.bbox.width).toBeCloseTo(10)
  })

  it('keeps each path in place when a later one starts with a relative "m"', () => {
    // An Affinity export: the same corner twice, the second one turned around and scaled down.
    const corner = 'M302.853,3030.269L294.019,4660.253L1513.194,4673.505L1522.029,4165.516L793.174,4156.681L788.757,3003.765L302.853,3030.269'
    const affinity = parseSvg(
      '<svg width="100%" height="100%" viewBox="0 0 3508 4961" xmlns="http://www.w3.org/2000/svg" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
        `<path d="${corner}"/><g transform="matrix(-0.420761,-0,0,-0.420761,3346.401341,2196.12617)"><path d="${corner}"/></g></svg>`
    )
    expect(affinity.width).toBe(3508)
    expect(affinity.height).toBe(4961)
    expect(affinity.bbox.x).toBeCloseTo(294.019)
    expect(affinity.bbox.y).toBeCloseTo(229.698)
    expect(affinity.bbox.right).toBeCloseTo(3222.69)
    expect(affinity.bbox.bottom).toBeCloseTo(4673.505)

    const wrap = (body: string): string => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">${body}</svg>`
    for (const body of [
      // Written that way in the file, closed or left open.
      '<path d="M10 10H20V20H10Z"/><path d="m100 100 10 0 0 10-10 0z"/>',
      '<path d="M10 10H20V20"/><path d="m100 100 10 0 0 10-10 0z"/>',
      // Under a group transform that is applied here, not by SVGO.
      '<g transform="translate(50 50)"><path d="M-40-40H-30V-30H-40Z"/><path d="m50 50 10 0 0 10-10 0z"/></g>'
    ]) {
      const r = parseSvg(wrap(body))
      expect(r.bbox.x, body).toBeCloseTo(10)
      expect(r.bbox.right, body).toBeCloseTo(110)
      expect(r.bbox.bottom, body).toBeCloseTo(110)
    }
  })

  it('leaves out shapes with neither fill nor stroke, such as the artboard rectangle Affinity exports', () => {
    const affinity = (board: string): string =>
      '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
      '<svg width="100%" height="100%" viewBox="0 0 600 1000" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
      `<g transform="matrix(1,0,0,1,-700,0)"><g id="B" serif:id="B" transform="matrix(1,0,0,1,700,0)">${board}</g></g></svg>`
    const glyph = '<g transform="matrix(1,0,0,1,-650,20)"><path d="M750,100L950,100L950,800L750,800Z"/></g>'
    for (const board of [
      `<rect x="0" y="0" width="600" height="1000" style="fill:none;"/>${glyph}`,
      // A clipped artboard repeats the rectangle as a clip path.
      `<rect x="0" y="0" width="600" height="1000" style="fill:none;"/><clipPath id="_clip1"><rect x="0" y="0" width="600" height="1000"/></clipPath><g clip-path="url(#_clip1)">${glyph}</g>`
    ]) {
      const r = parseSvg(affinity(board))
      // The artboard still sizes the glyph box, through the viewBox.
      expect(r.width, board).toBe(600)
      expect(r.height, board).toBe(1000)
      expect(r.bbox.x, board).toBeCloseTo(100)
      expect(r.bbox.y, board).toBeCloseTo(120)
      expect(r.bbox.right, board).toBeCloseTo(300)
      expect(r.bbox.bottom, board).toBeCloseTo(820)
    }
    // An artboard with nothing on it is an empty glyph, not a box.
    expect(parseSvg(affinity('<rect x="0" y="0" width="600" height="1000" style="fill:none;"/>')).exists).toBe(false)

    const wrap = (body: string): string => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">${body}<path d="M10 10H20V20H10Z"/></svg>`
    for (const unpainted of [
      '<path d="M100 100H400V400H100Z" fill="none"/>',
      '<path d="M100 100H400V400H100Z" fill="transparent" stroke="none"/>',
      '<g fill="none"><path d="M100 100H400V400H100Z"/></g>',
      '<style>.n{fill:none}</style><path class="n" d="M100 100H400V400H100Z"/>'
    ]) {
      expect(parseSvg(wrap(unpainted)).bbox.right, unpainted).toBeCloseTo(20)
    }
    // An outline drawn with a stroke only is still imported, and so is a fill set over fill="none".
    for (const painted of [
      '<path d="M100 100H400V400H100Z" fill="none" stroke="#000"/>',
      '<g stroke="#000"><path d="M100 100H400V400H100Z" style="fill:none"/></g>',
      '<g fill="none"><path d="M100 100H400V400H100Z" fill="#000"/></g>'
    ]) {
      expect(parseSvg(wrap(painted)).bbox.right, painted).toBeCloseTo(400)
    }
  })

  it('draws a <use> that refers to itself or to an element it is in like browsers do (not at all)', () => {
    const wrap = (body: string): string => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">${body}</svg>`
    for (const body of [
      '<g id="a"><path d="M0 0H10V10H0Z"/><use href="#a" x="20"/></g>',
      '<defs><g id="a"><path d="M0 0H10V10H0Z"/><use href="#a" x="20"/></g></defs><use href="#a"/>',
      '<defs><g id="a"><path d="M0 0H10V10H0Z"/><use href="#b" x="20"/></g><g id="b"><use href="#a" x="20"/></g></defs><use href="#a"/>',
      '<path d="M0 0H10V10H0Z"/><use id="u" href="#u" x="20"/>'
    ]) {
      const r = parseSvg(wrap(body))
      expect(r.exists, body).toBe(true)
      expect(r.bbox.right, body).toBeCloseTo(10)
    }
  })

  it('clips viewports of zero size away unless their overflow is visible, like browsers', () => {
    const wrap = (body: string): string => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">${body}<path d="M10 10H20V20H10Z"/></svg>`
    for (const body of [
      '<svg width="0" height="100"><path d="M100 100H400V400H100Z"/></svg>',
      '<defs><symbol id="s" viewBox="0 0 10 10"><path d="M0 0H10V10H0Z"/></symbol></defs><use href="#s" width="0" height="0"/>'
    ]) {
      const r = parseSvg(wrap(body))
      expect(r.bbox.x, body).toBeCloseTo(10)
      expect(r.bbox.width, body).toBeCloseTo(10)
    }
    // Drawn unscaled: Chromium skips the viewBox of a zero-size viewport.
    const visible = parseSvg(wrap('<defs><symbol id="s" viewBox="0 0 10 10" overflow="visible"><path d="M100 100H400V400H100Z"/></symbol></defs><use href="#s" width="0" height="0"/>'))
    expect(visible.bbox.right).toBeCloseTo(400)
  })

  it('says why an SVG cannot be read', () => {
    const r = parseSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10H')
    expect(r.exists).toBe(false)
    expect(tm(r.error!)).toMatch(/incomplete or malformed/)
    expect(parseSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>').error).toBeUndefined()
  })

  it('reads the document size in user units and ignores an invalid viewBox', () => {
    const pt = parseSvg('<svg xmlns="http://www.w3.org/2000/svg" width="72pt" height="36pt"><path d="M10 10H20V20H10Z"/></svg>')
    expect(pt.width).toBeCloseTo(96)
    expect(pt.height).toBeCloseTo(48)
    const bad = parseSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 10 0 0" width="50" height="50"><path d="M10 10H20V20H10Z"/></svg>')
    expect(bad.width).toBeCloseTo(50)
    expect(bad.bbox.x).toBeCloseTo(10)
  })

  it('applies class rules with descendant selectors only where they match', () => {
    const r = parseSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><style>.box .m{fill:none;stroke:#f0f}</style>' +
        '<g class="box"><path d="M10 10H20V20H10Z"/><path class="m" d="M0 0H40V80H0Z"/></g>' +
        '<defs><g class="box"><path class="m" d="M0 0H1V1H0Z"/></g></defs></svg>'
    )
    expect(r.markedBBox).toBe(true)
    expect(r.width).toBeCloseTo(40)
    expect(r.height).toBeCloseTo(80)
    expect(r.bbox.width).toBeCloseTo(10)
  })

  it('round-trips mkf-* attributes with EM rescaling', () => {
    const v = createVariant({ ...DEFAULT_TRANSFORMS, xshift: 20 }, { width: 500 })
    v.transforms.rot = null
    v.pathData = { exists: true, markedBBox: false, path: 'M0 0H10V10Z', width: 10, height: 10, bbox: { x: 0, y: 0, width: 10, height: 10, top: 0, bottom: 10, left: 0, right: 10 } }
    const svg = variantToSvg(v, 1000)
    const back = readMkfValues(svg, 2000)
    expect(back.transforms.xshift).toBe(40)
    expect(back.transforms.rot).toBeNull()
    expect(back.transforms.scale).toBe(DEFAULT_TRANSFORMS.scale)
    expect(back.variant.width).toBe(1000)
    const parsed = parseSvg(svg)
    expect(parsed.markedBBox).toBe(true)
    expect(parsed.width).toBeCloseTo(10)
  })
})

describe('import assignment', () => {
  it('parses filenames like v1', () => {
    expect(keyFromFilename('char_A.svg', 'char', '_')).toBe('0041')
    expect(keyFromFilename('char_U+0041.svg', 'char', '_')).toBe('0041')
    expect(keyFromFilename('char_f_i.svg', 'char', '_')).toBe('0066+0069')
    expect(keyFromFilename('uni00E9.svg', '', '_')).toBe('00e9')
    expect(keyFromFilename('00e9.svg', '', '_')).toBe('00e9')
    expect(keyFromFilename('face.svg', '', '_')).toBe('0066+0061+0063+0065')
    expect(keyFromFilename('u1F600.svg', '', '_')).toBe('1f600')
  })

  it('detects a shared prefix', () => {
    expect(detectPrefixSeparator(['char_A.svg', 'char_B.svg', 'char_C.svg'])).toEqual({ prefix: 'char', separator: '_' })
    expect(detectPrefixSeparator(['A.svg', 'B.svg'])).toEqual({ prefix: '', separator: '_' })
  })

  it('assigns to a block starting at the first empty slot', () => {
    const items = ['a', 'b', 'c'].map((n) => ({ name: n, enabled: true, custom: '' }))
    const keys = assignKeys(items, {
      mode: AssignMode.Block,
      prefix: '',
      separator: '_',
      selection: [],
      block: { start: 0x41, end: 0x42 },
      blockStart: BlockStart.FirstEmpty,
      exists: (k) => k === '0041'
    })
    expect(keys).toEqual(['0042', '0043', '0044'])
  })
})
