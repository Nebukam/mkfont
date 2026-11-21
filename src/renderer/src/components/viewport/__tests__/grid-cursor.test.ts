import { describe, expect, it } from 'vitest'
import { neighbourAfterRemoval } from '../grid-cursor'

describe('grid cursor after a delete', () => {
  const before = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

  it('goes to the first glyph after the deleted ones, wherever the cursor was in them', () => {
    // C…F deleted with the cursor on F (a Shift+click range), or on C.
    expect(neighbourAfterRemoval(before, 5, ['A', 'B', 'G', 'H', 'I', 'J'])).toBe('G')
    expect(neighbourAfterRemoval(before, 2, ['A', 'B', 'G', 'H', 'I', 'J'])).toBe('G')
  })

  it('falls back to the nearest glyph before them at the end of the list', () => {
    expect(neighbourAfterRemoval(before, 9, ['A', 'B', 'C'])).toBe('C')
    expect(neighbourAfterRemoval(before, 0, [])).toBeNull()
  })
})
