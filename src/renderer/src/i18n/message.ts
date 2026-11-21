// Messages that code without React or i18n produces (core/, stores) and the UI shows:
// a catalog key with its values, translated where it is displayed. Type-only imports,
// so core modules stay free of the i18n instance.
import type { ParseKeys } from 'i18next'

export type MessageKey = ParseKeys
export interface Message {
  key: MessageKey
  values?: Record<string, unknown>
}

/** A message to translate later: `msg('export.warnings.outOfBounds', { glyph })`. */
export const msg = (key: MessageKey, values?: Record<string, unknown>): Message => ({ key, values })

export const isMessage = (m: unknown): m is Message =>
  typeof m === 'object' && m !== null && typeof (m as Message).key === 'string' && !(m instanceof Error)

/**
 * An error whose text is a catalog message: `throw new MessageError(msg('export.noGlyphs'))`.
 * `errorMessage(e)` (lib/errors) translates it. Its `message` is the key, for logs.
 */
export class MessageError extends Error {
  constructor(readonly msg: Message) {
    super(msg.key)
    this.name = 'MessageError'
  }
}
