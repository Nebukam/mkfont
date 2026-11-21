// ============================================================
// Unicode key helpers
//
// Glyph keys are lowercase hex code points padded to 4 digits.
// Ligatures join their code points with '+': "0066+0069".
// ============================================================

export function codePointToKey(cp: number): string {
  return cp.toString(16).toLowerCase().padStart(4, '0')
}

/** Normalize any key-ish input ("U+0041", "41", "0066+0069") to a glyph key. */
export function normalizeKey(input: string): string {
  return input
    .split('+')
    .filter((p) => p.length > 0 && p.toUpperCase() !== 'U')
    .map((p) => p.replace(/^u\+?/i, ''))
    .map((p) => p.toLowerCase().padStart(4, '0'))
    .join('+')
}

export function isLigatureKey(key: string): boolean {
  return key.includes('+')
}

export function keyToCodePoints(key: string): number[] {
  return key
    .split('+')
    .map((h) => parseInt(h, 16))
    .filter((n) => !isNaN(n) && n >= 0 && n <= 0x10ffff)
}

/**
 * Characters for a key ("0066+0069" → "fi"), control characters included ("000d" → "\r").
 * Only lone surrogates, which are not characters, are left out.
 */
export function keyToChars(key: string): string {
  let out = ''
  for (const cp of keyToCodePoints(key)) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue
    out += String.fromCodePoint(cp)
  }
  return out
}

/** Printable label for a key: C0/C1 control characters and lone surrogates become ''; format characters such as ZWJ stay. */
export function keyToDisplayChars(key: string): string {
  let out = ''
  for (const cp of keyToCodePoints(key)) {
    if (cp < 0x20 || (cp >= 0x7f && cp < 0xa0) || (cp >= 0xd800 && cp <= 0xdfff)) continue
    out += String.fromCodePoint(cp)
  }
  return out
}

/** Code points that show nothing in UI text: spaces, invisible format marks, private use. */
function rendersBlank(cp: number): boolean {
  return (
    /\s/u.test(String.fromCodePoint(cp)) ||
    (cp >= 0x200b && cp <= 0x200f) ||
    (cp >= 0x2060 && cp <= 0x206f) ||
    cp === 0xfeff ||
    (cp >= 0xe000 && cp <= 0xf8ff) ||
    cp >= 0xf0000
  )
}

/** A glyph's name in labels and notices: its characters, or "U+…" when they would show nothing. */
export function glyphLabel(key: string): string {
  const chars = keyToDisplayChars(key)
  return chars && !keyToCodePoints(key).every(rendersBlank) ? chars : formatKey(key)
}

/**
 * Values for a message about one or several glyphs: `count`, and `glyph` (the first one's
 * label). One glyph is named, several are counted, with two messages (a plural's "one" form
 * also covers 21, 31… in some languages, so it cannot name the glyph):
 * `t(keys.length === 1 ? 'edit.deletedGlyph' : 'edit.deletedGlyphs', glyphsValues(keys))` with
 * `deletedGlyph: 'Deleted {{glyph}}'`, `deletedGlyphs_one / _other: 'Deleted {{count, number}} glyph(s)'`.
 */
export function glyphsValues(keys: readonly string[]): { count: number; glyph: string } {
  return { count: keys.length, glyph: keys.length ? glyphLabel(keys[0]) : '' }
}

/** Key for a string of characters ("fi" → "0066+0069"). */
export function charsToKey(chars: string): string {
  return Array.from(chars)
    .map((c) => codePointToKey(c.codePointAt(0) ?? 0))
    .join('+')
}

/** "0041" → "U+0041", "0066+0069" → "U+0066+U+0069" */
export function formatKey(key: string): string {
  return key
    .split('+')
    .map((h) => `U+${h.toUpperCase()}`)
    .join('+')
}

/** v1 UNICODE.UUni(): "U+0041" or "U+0066U+0069" for ligatures (re-parsable). */
export function keyToUUni(key: string): string {
  return key
    .split('+')
    .map((h) => `U+${h}`)
    .join('')
}

/**
 * v1 UNICODE.ResolveString(): expands `U+XXXX` sequences into characters.
 * Accepts 'a', 'abc', 'aU+0000', 'U+0000U+0000', 'U+0000-abU+0000'.
 */
export function resolveString(input: string, sep = '-'): string {
  if (!input) return ''
  if (!input.includes('U+') && !input.includes('u+')) return input

  const chunks = input.split(/[Uu]\+/)
  let result = ''
  if (chunks.length >= 2) {
    const prefix = chunks.shift()!
    if (prefix !== '') result += prefix
  }
  for (const chunk of chunks) {
    if (chunk === '') continue
    const parts = chunk.split(sep)
    const hexMatch = /^[0-9a-fA-F]{1,6}/.exec(parts[0])
    if (hexMatch) {
      const cp = parseInt(hexMatch[0], 16)
      if (cp >= 0 && cp <= 0x10ffff && !(cp >= 0xd800 && cp <= 0xdfff)) result += String.fromCodePoint(cp)
      else result += `U+${hexMatch[0]}`
      result += parts[0].slice(hexMatch[0].length)
    } else {
      result += `U+${parts[0]}`
    }
    parts.shift()
    if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) continue
    result += parts.join(sep)
  }
  return result
}

/**
 * Resolve a layer character reference / user input into a glyph key
 * (v1 UNICODE.TryGetInfosFromString). Iterates code points, so astral
 * characters resolve correctly.
 */
export function refToKey(ref: string | null | undefined): string | null {
  if (!ref) return null
  const resolved = resolveString(ref)
  if (!resolved) return null
  const key = charsToKey(resolved)
  return key || null
}

/**
 * Parse free user input into a key: "A", "U+0041", "0041", "fi", "U+0066U+0069".
 * Bare hex is accepted only when it is 4–6 hex digits.
 */
export function parseUserKey(input: string): string | null {
  const s = input.trim()
  if (!s) return null
  if (/^[0-9a-fA-F]{4,6}$/.test(s)) {
    const cp = parseInt(s, 16)
    return cp <= 0x10ffff ? codePointToKey(cp) : null
  }
  return refToKey(s)
}

/**
 * Like parseUserKey, but only for inputs that clearly name a glyph:
 * a single character, U+ codes (incl. ligatures "U+0066U+0069") or 4–6 digit hex.
 * Plain words ("export", "acute") are not treated as ligatures.
 */
export function parseExplicitKey(input: string): string | null {
  const s = input.trim()
  if (!s) return null
  // Hex needs a digit so words like "face" stay words.
  if (Array.from(s).length === 1 || /^[Uu]\+/.test(s) || /^(?=.*\d)[0-9a-fA-F]{4,6}$/.test(s)) return parseUserKey(s)
  return null
}

export function compareKeys(a: string, b: string): number {
  const la = a.includes('+')
  const lb = b.includes('+')
  if (la !== lb) return la ? 1 : -1
  if (!la) return parseInt(a, 16) - parseInt(b, 16)
  return a < b ? -1 : a > b ? 1 : 0
}
