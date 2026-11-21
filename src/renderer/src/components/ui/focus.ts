// ============================================================
// Keyboard focus: where it goes when an action removes the control that had it,
// and arrow-key movement in grids of buttons that are a single tab stop.
// ============================================================

import { isMac } from '../../platform'

const TEXT_INPUTS = new Set(['text', 'search', 'number', 'email', 'url', 'password', 'tel'])

/** A field keys type into (selects, checkboxes, sliders and buttons don't count). */
export function isTextField(el: Element | null): boolean {
  if (!el) return false
  if (el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable) return true
  return el.tagName === 'INPUT' && TEXT_INPUTS.has((el as HTMLInputElement).type)
}

/**
 * Keys typed in a text field stay in it, except the shortcuts that work while typing
 * (Ctrl+S, Ctrl+Tab, Ctrl+P, F1…). Those reach the app's keyboard handler, which lets
 * only them act from a field: Ctrl+A, Ctrl+Z and the clipboard keys still edit the text.
 * On macOS the shortcuts use Command: Control+letter keeps editing the text.
 */
export function keepTypingKeys(
  e: Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'altKey' | 'key' | 'stopPropagation'>,
  mac = isMac
): void {
  const shortcut = mac ? e.metaKey || (e.ctrlKey && e.key === 'Tab') : e.ctrlKey || e.metaKey
  if (shortcut || e.altKey || /^F\d{1,2}$/.test(e.key)) return
  e.stopPropagation()
}

// ---- Fields that commit typed text when they lose focus ----

interface EditedField {
  el: HTMLElement
  commit: () => void
  /** Holds typed text not committed yet. */
  dirty: boolean
}

/** The focused field that commits on blur, and how to commit it right away. */
let editing: EditedField | null = null
const typingListeners = new Set<() => void>()
const notifyTyping = (): void => typingListeners.forEach((fn) => fn())

/** A field that commits on blur gained focus: `commit` commits its typed text now. */
export function trackFieldEdit(el: HTMLElement, commit: () => void): void {
  editing = { el, commit, dirty: false }
  notifyTyping()
}

export function untrackFieldEdit(el: HTMLElement): void {
  if (editing?.el !== el) return
  editing = null
  notifyTyping()
}

/** The tracked field holds typed text not committed yet (true), or not anymore. */
export function reportFieldDirty(el: HTMLElement, dirty: boolean): void {
  if (editing?.el !== el || editing.dirty === dirty) return
  editing.dirty = dirty
  notifyTyping()
}

/** Text is being typed that no font holds yet: closing the window must ask first. */
export function isTypingUncommitted(): boolean {
  return !!editing?.dirty
}

export function subscribeTyping(fn: () => void): () => void {
  typingListeners.add(fn)
  return () => {
    typingListeners.delete(fn)
  }
}

function editedField(): EditedField | null {
  return editing && typeof document !== 'undefined' && document.activeElement === editing.el ? editing : null
}

/**
 * Commit the text typed in the focused field into the font shown now (before Save,
 * Export, another font, or asking about unsaved changes). The field keeps focus and
 * shows the font's value from then on, so the keys typed next still edit it.
 */
export function commitFieldEdit(): void {
  editedField()?.commit()
}

/** A field's accessible name: its row label, or its own label. */
function fieldName(el: Element): string {
  const ids = el.getAttribute('aria-labelledby')
  if (ids) return ids.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim()
  return el.getAttribute('aria-label') ?? ''
}

/** A field that had focus, to give focus back to it (or to its counterpart in another view). */
export interface FieldMemo {
  el: HTMLElement
  name: string
  scope: HTMLElement | null
  /** Its place among the fields with that label (each component has an "X"). */
  index: number
}

/** The fields labelled `name`, in page order. */
function fieldsNamed(scope: HTMLElement | null, name: string): HTMLElement[] {
  return [...(scope ?? document).querySelectorAll<HTMLElement>('input, textarea')].filter((el) => fieldName(el) === name)
}

function memoOf(el: HTMLElement): FieldMemo {
  const scope = el.parentElement?.closest<HTMLElement>('aside, [role="dialog"]') ?? null
  const name = fieldName(el)
  return { el, name, scope, index: name ? fieldsNamed(scope, name).indexOf(el) : -1 }
}

/** The field that had focus when another font came up, kept until that font is on screen. */
let switching: FieldMemo | null = null
/** Focus fell to the page with the field it was in: single keys wait for the user's next move. */
let parked = false

/** Before another font is shown: commit the focused field into the font it was typed for. */
export function commitFieldForSwitch(): void {
  // A record no screen update took (a font shown and left within one tick) is stale.
  switching = null
  switchingForced = false
  const field = editedField()
  if (!field) return
  field.commit()
  switching = memoOf(field.el)
}

/** The field being typed in, for a flow that shows other fonts and comes back. */
export function focusedField(): FieldMemo | null {
  const field = editedField()
  return field ? memoOf(field.el) : null
}

/** Set by `refocusAfterSwitch`: the settle after it overrides focus that fell back meanwhile. */
let switchingForced = false

/**
 * After a flow of prompts: the next font switch on screen gives focus back to this field
 * (or its counterpart), also when it fell to the grid or the page meanwhile.
 */
export function refocusAfterSwitch(memo: FieldMemo): void {
  switching = memo
  switchingForced = true
}

/** The same, now: for a flow that ends on the font already shown. */
export function restoreFieldFocus(memo: FieldMemo): void {
  giveFocusBack(memo, true)
}

/**
 * Once the other font is on screen (a layout effect, before any key is handled): the
 * field keeps focus if it is still there; else its counterpart in the new view (same
 * label) takes it. With neither, focus is on the page, where single keys act on glyphs:
 * they are held back until the user clicks or focuses something.
 */
export function settleFieldFocus(): void {
  const s = switching
  const force = switchingForced
  switching = null
  switchingForced = false
  if (s) giveFocusBack(s, force)
}

/**
 * Focus back to the field `s` remembers, or to its counterpart (same label); with neither,
 * single keys are held back on the page. `force`: focus the app moved to the grid or the
 * page meanwhile (a prompt closing) does not count as the user's choice.
 */
function giveFocusBack(s: FieldMemo, force: boolean): void {
  if (typeof document === 'undefined') return
  const usable = (el: Element): boolean => el.isConnected && !(el as HTMLInputElement).disabled
  const active = document.activeElement as HTMLElement | null
  if (active === s.el && usable(s.el)) return
  const fellBack = !active || active === document.body || active.hasAttribute('data-focus-fallback')
  // Focus that went somewhere on purpose (a dialog) stays there.
  if (active && active !== s.el && !(force ? fellBack : active === document.body)) return
  // The field itself if it is still there, else the one in its place among those with its
  // label, else the first of them.
  const named = s.name ? fieldsNamed(s.scope, s.name) : []
  const twin = [s.el, named[s.index], ...named].find((el) => !!el && usable(el))
  if (twin) twin.focus({ preventScroll: true })
  else {
    if (active && active !== document.body) active.blur()
    parked = true
  }
}

/** Single keys (Delete, digits) are held back: see `settleFieldFocus`. */
export function isFocusParked(): boolean {
  return parked && typeof document !== 'undefined' && document.activeElement === document.body
}

/** The user clicked or moved focus: single keys act again. */
export function unparkFocus(): void {
  parked = false
}

/** Takes focus when it is lost: the glyph grid marks itself with this attribute. */
const FALLBACK = '[data-focus-fallback]'

/** Focus fell to the page, or sits on a control that was just disabled. */
function isLost(el: Element | null): boolean {
  return !el || el === document.body || (el as HTMLButtonElement).disabled === true
}

/**
 * Focus the main focus target (the glyph grid) once it is on screen: it may mount a
 * few frames after the action. Unless `force`, only when focus is lost, so focus that
 * went somewhere useful stays there. `cancel` drops the attempt (the user typed again).
 */
export function focusFallback(opts: { force?: boolean; frames?: number; cancel?: () => boolean } = {}): void {
  const { force = false, frames = 3, cancel } = opts
  requestAnimationFrame(() => {
    // Focus held back on the page (see `giveFocusBack`) must not move to the grid, where
    // single keys act on glyphs.
    if (cancel?.() || isFocusParked() || (!force && !isLost(document.activeElement))) return
    const target = document.querySelector<HTMLElement>(FALLBACK)
    if (target) target.focus({ preventScroll: true })
    else if (frames > 1) focusFallback({ force, frames: frames - 1, cancel })
  })
}

/**
 * Give focus back when a menu or dialog (`layer`) closes: to `previous`, or to the
 * main focus target should the action have removed it (a delete re-renders the
 * inspector). Focus the action moved somewhere on purpose stays there.
 */
export function restoreFocus(previous: HTMLElement | null, layer: HTMLElement | null): void {
  const active = document.activeElement
  if (!isLost(active) && !layer?.contains(active)) return
  if (previous?.isConnected) previous.focus({ preventScroll: true })
  focusFallback()
}

/**
 * Keyboard movement in a wrapping grid of buttons that is a single tab stop (the
 * button with tabIndex 0): arrows, Home and End. Up / Down go to the closest button
 * in the next row, so rows of uneven length (wrapped chips) work too.
 */
export function moveGridFocus(e: React.KeyboardEvent<HTMLElement>): void {
  if (e.altKey || e.ctrlKey || e.metaKey) return
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(':scope > button:not(:disabled)'))
  const cur = items.indexOf(e.target as HTMLElement)
  if (cur === -1) return
  let next: number
  switch (e.key) {
    case 'ArrowLeft': next = cur - 1; break
    case 'ArrowRight': next = cur + 1; break
    case 'ArrowUp': next = rowNeighbour(items, cur, -1); break
    case 'ArrowDown': next = rowNeighbour(items, cur, 1); break
    case 'Home': next = 0; break
    case 'End': next = items.length - 1; break
    default: return
  }
  e.preventDefault()
  items[Math.max(0, Math.min(items.length - 1, next))].focus()
}

/** Index of the button in the row above (-1) or below (1) closest to `cur` horizontally; `cur` on the edge rows. */
function rowNeighbour(items: HTMLElement[], cur: number, dir: 1 | -1): number {
  const center = (el: HTMLElement): number => el.offsetLeft + el.offsetWidth / 2
  const x = center(items[cur])
  let rowTop: number | null = null
  let best = cur
  for (let i = cur + dir; i >= 0 && i < items.length; i += dir) {
    const top = items[i].offsetTop
    if (top === items[cur].offsetTop) continue
    if (rowTop === null) rowTop = top
    else if (top !== rowTop) break
    if (best === cur || Math.abs(center(items[i]) - x) < Math.abs(center(items[best]) - x)) best = i
  }
  return best
}
