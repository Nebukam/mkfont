// ============================================================
// The font files the app exports.
// ============================================================

/** The two fonts the app builds, by outline flavour (export-font.ts). */
export type FontFormat = 'ttf' | 'otf'

/** The files the app exports: both fonts, and the web containers (WOFF, WOFF2) of the TrueType one. */
export type FileFormat = FontFormat | 'woff' | 'woff2'

export const FILE_FORMATS: readonly FileFormat[] = ['ttf', 'otf', 'woff', 'woff2']

/** The font each file holds, and its media type. */
export const FILE_FORMAT_INFO: Record<FileFormat, { font: FontFormat; mime: string }> = {
  ttf: { font: 'ttf', mime: 'font/ttf' },
  otf: { font: 'otf', mime: 'font/otf' },
  woff: { font: 'ttf', mime: 'font/woff' },
  woff2: { font: 'ttf', mime: 'font/woff2' }
}
