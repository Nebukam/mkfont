import { MessageError, tm } from '../i18n'

/**
 * Readable text for anything thrown, translated when it is a `MessageError`. Some
 * libraries throw plain strings (opentype.js argument checks), which have no `.message`.
 */
export function errorMessage(e: unknown): string {
  if (e instanceof MessageError) return tm(e.msg)
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  try {
    return JSON.stringify(e) ?? String(e)
  } catch {
    return String(e)
  }
}
