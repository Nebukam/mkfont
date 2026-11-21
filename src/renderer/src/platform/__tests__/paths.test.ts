import { describe, expect, it } from 'vitest'
import { basename, dirname, joinPath } from '..'

describe('path helpers', () => {
  it('splits Windows and POSIX paths', () => {
    const win = String.raw`C:\fonts\demo\a.mkfont`
    expect(dirname(win)).toBe(String.raw`C:\fonts\demo`)
    expect(basename(win)).toBe('a.mkfont')
    expect(dirname('/home/me/a.mkfont')).toBe('/home/me')
    expect(dirname('a.mkfont')).toBe('')
  })

  it('joins with the folder separator style', () => {
    expect(joinPath(String.raw`C:\fonts`, 'a.ttf')).toBe(String.raw`C:\fonts\a.ttf`)
    expect(joinPath('/home/me', 'a.ttf')).toBe('/home/me/a.ttf')
    expect(joinPath('C:/fonts/', 'a.ttf')).toBe('C:/fonts/a.ttf')
    expect(joinPath('', 'a.ttf')).toBe('a.ttf')
  })
})
