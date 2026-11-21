// ============================================================
// Compression for the web font formats (core/woff.ts): zlib for
// WOFF, Brotli for WOFF2. Browsers compress through
// CompressionStream; few of them have Brotli there, so the desktop
// app asks its main process (Node's zlib) for it.
// ============================================================

import { MessageError, msg } from '../i18n'

const api = typeof window !== 'undefined' ? window.api : undefined

async function throughStream(format: string, bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream(format as CompressionFormat))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

let streamBrotli: boolean | undefined

/** Whether this browser's CompressionStream writes Brotli. */
function hasStreamBrotli(): boolean {
  if (streamBrotli === undefined) {
    try {
      new CompressionStream('brotli' as CompressionFormat)
      streamBrotli = true
    } catch {
      streamBrotli = false
    }
  }
  return streamBrotli
}

/** zlib (RFC 1950) compression. */
export function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  return throughStream('deflate', bytes)
}

/** Whether Brotli compression is available here: always in the desktop app, in some browsers. */
export function canBrotli(): boolean {
  return !!api || hasStreamBrotli()
}

export async function brotli(bytes: Uint8Array): Promise<Uint8Array> {
  if (api) return api.brotliCompress(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer)
  if (hasStreamBrotli()) return throughStream('brotli', bytes)
  throw new MessageError(msg('document.export.noBrotli'))
}
