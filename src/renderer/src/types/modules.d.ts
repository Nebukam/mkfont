/** App version from package.json (Vite define). */
declare const __APP_VERSION__: string

declare module 'svg2ttf' {
  interface Svg2TtfOptions {
    copyright?: string
    description?: string
    familyname?: string
    subfamilyname?: string
    url?: string
    version?: string
    ts?: number
  }
  export default function svg2ttf(svgFontString: string, options?: Svg2TtfOptions): { buffer: Uint8Array }
}

declare module 'svgo/dist/svgo.browser.js' {
  export { optimize } from 'svgo'
  export type { Config } from 'svgo'
}
