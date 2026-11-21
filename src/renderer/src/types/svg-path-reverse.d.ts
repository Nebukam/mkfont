declare module 'svg-path-reverse' {
  const SVGPathReverse: {
    normalize(d: string): string
    reverseNormalized(d: string): string
    reverse(d: string): string
  }
  export default SVGPathReverse
}
