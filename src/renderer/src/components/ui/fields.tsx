// ============================================================
// Form controls. `undefined` values mean "mixed" (multi-selection
// with differing values); `null` means "inherited from the family".
// ============================================================

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link2, Unlink2, Check, Minus } from 'lucide-react'
import { cn } from '../../lib/cn'
import { isTextField, keepTypingKeys, reportFieldDirty, trackFieldEdit, untrackFieldEdit } from './focus'
import { useTranslation } from '../../i18n'

// ---- Accessible names: a Row names the controls inside it ----

interface FieldLabel {
  /** id of the Row's label element. */
  id: string
  /** The Row's help text. */
  description?: string
}

const FieldLabelContext = createContext<FieldLabel | null>(null)

interface FieldNameProps {
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-description'?: string
}

/**
 * Name and description of a control: an explicit `ariaLabel` wins, then the Row
 * label (plus the control's own visible label), then the tooltip.
 */
function useFieldName({ ariaLabel, tip, labelId }: { ariaLabel?: string; tip?: string; labelId?: string }): FieldNameProps {
  const row = useContext(FieldLabelContext)
  const ids = [row?.id, labelId].filter(Boolean).join(' ')
  const name: FieldNameProps = ariaLabel ? { 'aria-label': ariaLabel } : ids ? { 'aria-labelledby': ids } : { 'aria-label': tip }
  const description = row?.description ?? tip
  if (description && description !== name['aria-label']) name['aria-description'] = description
  return name
}

// ---- Number formatting / parsing ----

export function formatNumber(v: number, precision = 3): string {
  if (!isFinite(v)) return ''
  if (Number.isInteger(v)) return String(v)
  return String(parseFloat(v.toFixed(precision)))
}

function decimalsOf(step: number): number {
  const s = String(step)
  const i = s.indexOf('.')
  return i === -1 ? 0 : s.length - i - 1
}

function roundTo(v: number, decimals: number): number {
  const f = Math.pow(10, Math.max(decimals, 0) + 2)
  return Math.round(v * f) / f
}

/** Evaluate a small arithmetic expression ("100*1.5", "-(20+4)/2"). */
export function evalExpression(input: string): number | null {
  const s = input.replace(/,/g, '.').replace(/\s+/g, '')
  if (!s) return null
  let i = 0
  const peek = (): string => s[i]
  const num = (): number => {
    if (peek() === '(') {
      i++
      const v = expr()
      if (peek() !== ')') throw new Error('paren')
      i++
      return v
    }
    if (peek() === '-') {
      i++
      return -num()
    }
    if (peek() === '+') {
      i++
      return num()
    }
    const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i))
    if (!m) throw new Error('num')
    i += m[0].length
    return parseFloat(m[0])
  }
  const term = (): number => {
    let v = num()
    while (peek() === '*' || peek() === '/') {
      const op = s[i++]
      const r = num()
      v = op === '*' ? v * r : v / r
    }
    return v
  }
  const expr = (): number => {
    let v = term()
    while (peek() === '+' || peek() === '-') {
      const op = s[i++]
      const r = term()
      v = op === '+' ? v + r : v - r
    }
    return v
  }
  try {
    const v = expr()
    return i === s.length && isFinite(v) ? v : null
  } catch {
    return null
  }
}

// ---- NumberField ----

export interface NumberMeta {
  /** True for continuous gestures (scrub, wheel, arrows) — callers merge history. */
  interactive: boolean
}

/** Sideways pixels of drag for one step of the value. */
const SCRUB_PX = 2
/** Sideways pixels before a press becomes a drag: under it, it is a click. */
const SCRUB_THRESHOLD = 3

/** Share of the window a locked pointer cannot cross in one event: such a movement is dropped. */
const SCRUB_JUMP = 0.3

/** A press on the label or the field that may become a drag. */
interface Scrub {
  /** The pressed element: it captures the pointer, then locks it. */
  el: HTMLElement
  pointerId: number
  /** Where the pointer was at the last event. */
  x: number
  /** Travel not turned into steps yet. */
  travel: number
  /** Past the threshold: a drag, not a click. */
  moved: boolean
  /** The pointer lock was granted. */
  locked: boolean
  onLockChange: () => void
}

export interface NumberFieldProps {
  value: number | null | undefined
  onChange: (v: number | null, meta: NumberMeta) => void
  /** Short label shown inside the field (dragging it changes the value, like dragging the field). */
  label?: string
  step?: number
  min?: number
  max?: number
  precision?: number
  suffix?: string
  /** Value used when `value` is null (family value). */
  inherited?: number
  /** Show a link toggle: linked = null = follow the family value. */
  linkable?: boolean
  /** Allow clearing the field to null. */
  nullable?: boolean
  disabled?: boolean
  tip?: string
  /** Accessible name when neither a Row nor `label` names the field. */
  ariaLabel?: string
  className?: string
}

export function NumberField({
  value,
  onChange,
  label,
  step = 1,
  min,
  max,
  precision = 3,
  suffix,
  inherited,
  linkable,
  nullable,
  disabled,
  tip,
  ariaLabel,
  className
}: NumberFieldProps): React.ReactElement {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const labelId = useId()
  const name = useFieldName({ ariaLabel, tip, labelId: label ? labelId : undefined })
  const [text, setText] = useState('')
  // True while the text holds typed input that has not been committed yet.
  // Focusing and leaving a field without typing never writes a value.
  const [dirty, setDirtyState] = useState(false)
  const dirtyRef = useRef(false)
  const setDirty = (d: boolean): void => {
    dirtyRef.current = d
    setDirtyState(d)
    if (inputRef.current) reportFieldDirty(inputRef.current, d)
  }
  const mixed = value === undefined
  const linked = value === null
  const effective = value ?? inherited ?? 0

  useEffect(() => {
    if (!dirty) setText(value === null || value === undefined ? '' : formatNumber(value, precision))
  }, [value, dirty, precision])

  const clamp = useCallback(
    (v: number): number => {
      let out = v
      if (min !== undefined) out = Math.max(min, out)
      if (max !== undefined) out = Math.min(max, out)
      return out
    },
    [min, max]
  )

  // Last stepped value until the next render: fast wheel events arrive before React
  // re-renders, and each step must build on the previous one.
  const steppedRef = useRef<number | null>(null)
  useEffect(() => {
    steppedRef.current = null
  }, [value])

  /** Step the value (arrows, wheel); starts from the typed text when there is some. */
  const nudge = (dir: number, e: { shiftKey: boolean; altKey: boolean }): void => {
    const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1
    const base = dirtyRef.current ? (evalExpression(text) ?? effective) : (steppedRef.current ?? effective)
    const next = clamp(roundTo(base + dir * step * mult, decimalsOf(step * mult)))
    steppedRef.current = next
    setDirty(false)
    onChange(next, { interactive: true })
  }
  const nudgeRef = useRef(nudge)
  nudgeRef.current = nudge

  // Wheel: adjusts when the field is focused, or anywhere with Ctrl held.
  useEffect(() => {
    const el = inputRef.current
    if (!el || disabled) return
    const onWheel = (e: WheelEvent): void => {
      if (document.activeElement !== el && !e.ctrlKey) return
      e.preventDefault()
      nudgeRef.current(e.deltaY < 0 ? 1 : -1, e)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [disabled])

  const commit = (): void => {
    if (!dirtyRef.current) return
    setDirty(false)
    const t = text.trim()
    if (t === '') {
      // Clearing a linkable / nullable field returns it to the inherited value. A mixed
      // field shows nothing to begin with, so clearing it leaves every value as it was
      // (the link button sets them all to inherit on purpose).
      if (!mixed && (nullable || linkable) && value !== null) onChange(null, { interactive: false })
      return
    }
    const v = evalExpression(t)
    if (v === null) return
    const next = clamp(v)
    if (next !== value) onChange(next, { interactive: false })
  }
  // Save, Export and font switches commit the typed text without waiting for the blur.
  const commitRef = useRef(commit)
  commitRef.current = commit

  // Scrubbing: drag the label, or the field itself while it is not being typed in. The
  // value steps like the wheel does, once per SCRUB_PX of sideways travel. The pointer is
  // locked for the drag (hidden, and it never runs into a screen edge) where the browser
  // allows it; else it is only captured, and the drag ends at the edge of the screen.
  // The lock asks for the mouse's own movement (`unadjustedMovement`). Without it,
  // Chromium on Windows keeps a locked pointer inside the window by moving it back to the
  // window's center whenever it is within 15% of an edge, which is where the inspector
  // is: that move comes through as one huge movement toward the center, and the value
  // jumps by hundreds of steps as the drag starts.
  const scrub = useRef<Scrub | null>(null)
  const endScrub = (): Scrub | null => {
    const s = scrub.current
    if (!s) return null
    scrub.current = null
    document.removeEventListener('pointerlockchange', s.onLockChange)
    if (document.pointerLockElement === s.el) document.exitPointerLock()
    else if (s.el.hasPointerCapture?.(s.pointerId)) s.el.releasePointerCapture(s.pointerId)
    return s
  }
  // A field removed in the middle of a drag (the selection changed) lets the pointer go.
  useEffect(() => () => void endScrub(), [])

  const onScrubDown = (e: React.PointerEvent<HTMLElement>): void => {
    if (disabled || e.button !== 0 || scrub.current) return
    const el = e.currentTarget
    // A field being typed in keeps the mouse for its text: caret and selection.
    if (el === inputRef.current && document.activeElement === el) return
    // No focus and no text selection yet: a press that does not move focuses on release.
    e.preventDefault()
    el.setPointerCapture?.(e.pointerId)
    const s: Scrub = {
      el,
      pointerId: e.pointerId,
      x: e.clientX,
      travel: 0,
      moved: false,
      // Escape (or the browser) released the pointer: the drag ends where it is.
      onLockChange: () => {
        if (document.pointerLockElement === el) s.locked = true
        else if (s.locked && scrub.current === s) endScrub()
      },
      locked: false
    }
    scrub.current = s
  }
  const onScrubMove = (e: React.PointerEvent<HTMLElement>): void => {
    const s = scrub.current
    if (!s || e.pointerId !== s.pointerId) return
    if (!s.moved) {
      if (Math.abs(e.clientX - s.x) < SCRUB_THRESHOLD) return
      s.moved = true
      // The drag counts from the threshold on: the value does not jump as it starts.
      s.x += Math.sign(e.clientX - s.x) * SCRUB_THRESHOLD
      // Like a click in the field would: text typed in another field is committed.
      const active = document.activeElement
      if (active !== inputRef.current && isTextField(active)) (active as HTMLElement).blur()
      document.addEventListener('pointerlockchange', s.onLockChange)
      try {
        // Refused (no recent click, Escape just released it, or no unadjusted movement on
        // this system): the drag goes on captured.
        void Promise.resolve(s.el.requestPointerLock?.({ unadjustedMovement: true })).then(
          // Granted after the button was released: nothing holds it anymore.
          () => {
            if (scrub.current !== s && document.pointerLockElement === s.el) document.exitPointerLock()
          },
          () => undefined
        )
      } catch {
        // No pointer lock here.
      }
    }
    // A locked pointer stays in place and only reports how far it would have moved.
    if (document.pointerLockElement === s.el) {
      // No hand crosses a third of the window between two events: that is the browser
      // putting the pointer somewhere else, not a drag.
      if (Math.abs(e.movementX) > window.innerWidth * SCRUB_JUMP || Math.abs(e.movementY) > window.innerHeight * SCRUB_JUMP) return
      s.travel += e.movementX
    } else s.travel += e.clientX - s.x
    s.x = e.clientX
    const steps = Math.trunc(s.travel / SCRUB_PX)
    if (steps === 0) return
    s.travel -= steps * SCRUB_PX
    nudge(steps, e)
  }
  const onScrubUp = (): void => {
    const s = endScrub()
    if (s && !s.moved) inputRef.current?.focus()
  }
  const onScrubMouseDown = (e: React.MouseEvent): void => {
    // The press belongs to the scrub: the field takes focus on release, if it did not move.
    if (scrub.current) e.preventDefault()
  }
  /** The pointer was taken away (a touch scroll, another window): the drag is over. */
  const onScrubLost = (e: React.PointerEvent<HTMLElement>): void => {
    const s = scrub.current
    // Locking the pointer releases its capture: the lock holds it from then on.
    if (!s || e.pointerId !== s.pointerId || document.pointerLockElement === s.el) return
    endScrub()
  }
  const scrubHandlers = {
    onPointerDown: onScrubDown,
    onPointerMove: onScrubMove,
    onPointerUp: onScrubUp,
    onPointerCancel: onScrubLost,
    onLostPointerCapture: onScrubLost,
    onMouseDown: onScrubMouseDown
  }

  return (
    <div
      className={cn(
        'group/nf relative flex h-6 min-w-0 items-center rounded border border-line bg-raised transition-colors focus-within:border-accent hover:border-line-strong',
        disabled && 'pointer-events-none opacity-40',
        className
      )}
      data-tip={tip}
    >
      {label && (
        <span
          id={labelId}
          className="flex h-full shrink-0 cursor-ew-resize items-center pl-1.5 pr-1 text-2xs font-medium text-subtle hover:text-fg"
          {...scrubHandlers}
        >
          {label}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        spellCheck={false}
        disabled={disabled}
        {...name}
        {...scrubHandlers}
        value={text}
        placeholder={mixed ? '—' : linked && inherited !== undefined ? formatNumber(inherited, precision) : ''}
        onFocus={(e) => {
          e.currentTarget.select()
          trackFieldEdit(e.currentTarget, () => commitRef.current())
        }}
        onChange={(e) => {
          setText(e.target.value)
          setDirty(true)
        }}
        onBlur={(e) => {
          untrackFieldEdit(e.currentTarget)
          commit()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit()
            e.currentTarget.blur()
          } else if (e.key === 'Escape') {
            // Discard the typed text: the blur below then has nothing to commit.
            setDirty(false)
            e.currentTarget.blur()
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()
            nudge(e.key === 'ArrowUp' ? 1 : -1, e)
          }
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.stopPropagation()
          else keepTypingKeys(e)
        }}
        className={cn(
          // The drag cursor until the field is typed in.
          'h-full w-full min-w-0 cursor-ew-resize bg-transparent px-1.5 text-right font-mono text-xs text-fg outline-none placeholder:text-subtle focus:cursor-text',
          label && 'pl-0',
          linked && 'placeholder:italic'
        )}
      />
      {suffix && <span className="pointer-events-none pr-1.5 text-2xs text-subtle">{suffix}</span>}
      {linkable && (
        <button
          type="button"
          // Out of the tab order: clearing the field follows the font default too.
          tabIndex={-1}
          aria-label={t('ui.field.followDefault')}
          aria-pressed={linked}
          data-tip={linked ? t('ui.field.linkedTip') : t('ui.field.overriddenTip')}
          className={cn(
            'mr-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors',
            linked ? 'text-accent hover:bg-accent/15' : 'text-subtle hover:bg-hover hover:text-fg'
          )}
          onClick={() => onChange(linked ? (inherited ?? 0) : null, { interactive: false })}
        >
          {linked ? <Link2 size={12} /> : <Unlink2 size={12} />}
        </button>
      )}
    </div>
  )
}

// ---- TextField ----

export function TextField({
  value,
  onChange,
  placeholder,
  multiline,
  rows = 3,
  maxLength,
  className,
  mono,
  commitOnType,
  ariaLabel
}: {
  value: string | undefined
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
  rows?: number
  maxLength?: number
  className?: string
  mono?: boolean
  /** Fire onChange on every keystroke instead of on blur/enter. */
  commitOnType?: boolean
  /** Accessible name when no Row names the field. */
  ariaLabel?: string
}): React.ReactElement {
  const name = useFieldName({ ariaLabel })
  const [text, setText] = useState(value ?? '')
  // True while the text holds typed input not committed yet. Otherwise the field shows
  // the value, also while focused: after a commit it follows a font switch.
  const [dirty, setDirtyState] = useState(false)
  const dirtyRef = useRef(false)
  const fieldRef = useRef<HTMLElement | null>(null)
  const setDirty = (d: boolean): void => {
    dirtyRef.current = d
    setDirtyState(d)
    if (fieldRef.current) reportFieldDirty(fieldRef.current, d)
  }
  useEffect(() => {
    if (!dirty) setText(value ?? '')
  }, [value, dirty])
  const commit = (): void => {
    if (!dirtyRef.current) return
    setDirty(false)
    if (text !== (value ?? '')) onChange(text)
  }
  // Save, Export and font switches commit the typed text without waiting for the blur.
  const commitRef = useRef(commit)
  commitRef.current = commit
  /** Escape: drop the typed text; the blur then has nothing to commit. */
  const cancel = (el: HTMLElement): void => {
    setDirty(false)
    setText(value ?? '')
    el.blur()
  }
  const common = {
    ...name,
    value: text,
    placeholder: value === undefined ? '—' : placeholder,
    maxLength,
    spellCheck: false,
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      fieldRef.current = e.currentTarget
      trackFieldEdit(e.currentTarget, () => commitRef.current())
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      commit()
      untrackFieldEdit(e.currentTarget)
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setText(e.target.value)
      if (commitOnType) onChange(e.target.value)
      else setDirty(true)
    },
    className: cn(
      'w-full rounded border border-line bg-raised px-1.5 text-sm text-fg outline-none transition-colors placeholder:text-subtle hover:border-line-strong focus:border-accent',
      mono && 'font-mono text-xs',
      className
    )
  }
  if (multiline)
    return (
      <textarea
        {...common}
        rows={rows}
        className={cn(common.className, 'resize-y py-1 leading-snug')}
        onKeyDown={(e) => {
          if (e.key === 'Escape') cancel(e.currentTarget)
          keepTypingKeys(e)
        }}
      />
    )
  return (
    <input
      {...common}
      type="text"
      className={cn(common.className, 'h-6')}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') cancel(e.currentTarget)
        keepTypingKeys(e)
      }}
    />
  )
}

// ---- Select ----

export interface SelectOption<T extends string | number> {
  value: T
  label: string
}

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  className,
  disabled,
  tip,
  ariaLabel
}: {
  value: T | undefined
  options: SelectOption<T>[]
  onChange: (v: T) => void
  className?: string
  disabled?: boolean
  tip?: string
  ariaLabel?: string
}): React.ReactElement {
  const { t } = useTranslation()
  const isNum = typeof options[0]?.value === 'number'
  const name = useFieldName({ ariaLabel, tip })
  return (
    <select
      data-tip={tip}
      {...name}
      disabled={disabled}
      value={value === undefined ? '__mixed' : String(value)}
      onChange={(e) => onChange((isNum ? Number(e.target.value) : e.target.value) as T)}
      className={cn(
        'h-6 w-full min-w-0 cursor-pointer rounded border border-line bg-raised px-1 text-xs text-fg outline-none transition-colors hover:border-line-strong focus:border-accent disabled:opacity-40',
        className
      )}
    >
      {value === undefined && (
        <option value="__mixed" disabled>
          {t('ui.field.mixed')}
        </option>
      )}
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// ---- Segmented ----

export interface SegmentOption<T> {
  value: T
  label?: string
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>
  tip?: string
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  className,
  disabled,
  stretch,
  ariaLabel
}: {
  value: T | undefined
  options: SegmentOption<T>[]
  onChange: (v: T) => void
  className?: string
  disabled?: boolean
  stretch?: boolean
  ariaLabel?: string
}): React.ReactElement {
  const name = useFieldName({ ariaLabel })
  return (
    <div role="group" {...name} className={cn('inline-flex h-6 rounded border border-line bg-raised p-px', stretch && 'flex w-full', disabled && 'opacity-40', className)}>
      {options.map((o) => {
        const Icon = o.icon
        const active = o.value === value
        const showLabel = !!o.label && (!Icon || stretch)
        return (
          <button
            key={String(o.value)}
            type="button"
            disabled={disabled}
            data-tip={o.tip ?? o.label}
            // Icon-only options are named by their tooltip; short labels ("H", "Min x") are explained by it.
            aria-label={showLabel ? undefined : (o.tip ?? o.label)}
            aria-description={showLabel && o.tip && o.tip !== o.label ? o.tip : undefined}
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex min-w-[22px] items-center justify-center gap-1 rounded-[3px] px-1.5 text-2xs font-medium transition-colors disabled:pointer-events-none',
              stretch && 'flex-1',
              active ? 'bg-accent-solid text-accent-fg' : 'text-muted hover:bg-hover hover:text-fg'
            )}
          >
            {Icon && <Icon size={12} strokeWidth={2} />}
            {showLabel && <span className="truncate">{o.label}</span>}
          </button>
        )
      })}
    </div>
  )
}

// ---- Slider ----

/** A range input in the app's style (`.slider` in index.css): the track fills up to the thumb. */
export function Slider({
  value,
  min,
  max,
  onChange,
  className,
  style,
  ...rest
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'min' | 'max' | 'onChange'>): React.ReactElement {
  const p = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn('slider', className)}
      style={{ ...style, ['--p' as string]: p }}
      {...rest}
    />
  )
}

// ---- Toggle / Checkbox ----

export function Toggle({
  checked,
  onChange,
  disabled,
  tip,
  ariaLabel
}: {
  checked: boolean | undefined
  onChange: (v: boolean) => void
  disabled?: boolean
  tip?: string
  ariaLabel?: string
}): React.ReactElement {
  const name = useFieldName({ ariaLabel, tip })
  return (
    <button
      type="button"
      // A switch cannot be "mixed": multi-selections with differing values read as a mixed checkbox.
      role={checked === undefined ? 'checkbox' : 'switch'}
      aria-checked={checked === undefined ? 'mixed' : checked}
      {...name}
      data-tip={tip}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-4 w-7 shrink-0 rounded-full transition-colors disabled:opacity-40',
        checked ? 'bg-accent-solid' : checked === undefined ? 'bg-accent-solid/40' : 'bg-line-strong'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-[left]',
          checked ? 'left-[14px]' : checked === undefined ? 'left-[8px]' : 'left-0.5'
        )}
      />
    </button>
  )
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
  tip,
  ariaLabel,
  className
}: {
  checked: boolean | undefined
  onChange: (v: boolean) => void
  label?: ReactNode
  disabled?: boolean
  tip?: string
  /** Accessible name for a checkbox without a visible label. */
  ariaLabel?: string
  className?: string
}): React.ReactElement {
  const name = useFieldName({ ariaLabel, tip })
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted hover:text-fg', disabled && 'pointer-events-none opacity-40', className)} data-tip={tip}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked === undefined ? 'mixed' : checked}
        // A visible label names the box through the wrapping <label>.
        {...(label ? {} : name)}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-colors',
          checked || checked === undefined ? 'border-accent-solid bg-accent-solid text-accent-fg' : 'border-line-strong bg-raised'
        )}
      >
        {checked === true && <Check size={10} strokeWidth={3} />}
        {checked === undefined && <Minus size={10} strokeWidth={3} />}
      </button>
      {label && <span className="select-none">{label}</span>}
    </label>
  )
}

// ---- Anchor picker (3×3) ----

/** Anchor positions in reading order (the 3×3 grid's cells). */
const ANCHOR_NAMES = ['topLeft', 'top', 'topRight', 'left', 'center', 'right', 'bottomLeft', 'bottom', 'bottomRight'] as const

export function AnchorPicker({
  value,
  onChange,
  tip,
  ariaLabel,
  size = 'md'
}: {
  value: number | undefined
  onChange: (v: number) => void
  /** Also its accessible name ("Rotation pivot"): more precise than the Row it sits in. */
  tip?: string
  ariaLabel?: string
  size?: 'sm' | 'md'
}): React.ReactElement {
  const { t } = useTranslation()
  const cell = size === 'sm' ? 'h-[7px] w-[7px]' : 'h-2.5 w-2.5'
  const groupName = useFieldName({ ariaLabel: ariaLabel ?? tip })
  const ref = useRef<HTMLDivElement>(null)
  // One tab stop: the chosen anchor (or the center when mixed); arrow keys move in the 3×3 grid.
  const focusIndex = value ?? 4
  const onKeyDown = (e: React.KeyboardEvent): void => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[e.key]
    if (step === undefined) return
    e.preventDefault()
    e.stopPropagation()
    const col = focusIndex % 3
    if ((step === -1 && col === 0) || (step === 1 && col === 2)) return
    const next = focusIndex + step
    if (next < 0 || next > 8) return
    onChange(next)
    ref.current?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
  }
  return (
    <div
      ref={ref}
      // w-fit: its own size even in a column that would stretch it.
      className={cn('grid w-fit shrink-0 grid-cols-3 rounded border border-line bg-raised p-[3px]', size === 'sm' ? 'gap-[2px]' : 'gap-[3px]')}
      role="radiogroup"
      {...groupName}
      onKeyDown={onKeyDown}
    >
      {ANCHOR_NAMES.map((id, i) => {
        const name = t(`ui.anchor.${id}`)
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={name}
            tabIndex={i === focusIndex ? 0 : -1}
            data-tip={tip ? t('ui.anchor.tip', { tip, name }) : name}
            onClick={() => onChange(i)}
            className={cn(
              cell,
              'rounded-[2px] transition-colors',
              value === i ? 'bg-accent-solid' : 'bg-line-strong/60 hover:bg-subtle'
            )}
          />
        )
      })}
    </div>
  )
}

// ---- Color ----

export function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }): React.ReactElement {
  const name = useFieldName({})
  return (
    <div className="flex h-6 items-center gap-1.5">
      <input
        type="color"
        {...name}
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-8 cursor-pointer rounded border border-line bg-raised p-0.5"
      />
      <TextField value={value} onChange={onChange} mono className="w-20" />
    </div>
  )
}

// ---- Layout rows ----

const RowsContext = createContext(false)

/**
 * A list of Rows whose label column is as wide as its longest label (up to 45% of the
 * list), so a translated label is not cut where the English one fits. Its children are
 * Rows and elements that span the list (`col-span-full`); a Row inside another element
 * would not line up.
 */
export function Rows({ children, className }: { children: ReactNode; className?: string }): React.ReactElement {
  return (
    <div className={cn('grid grid-cols-[fit-content(45%)_minmax(0,1fr)] gap-2', className)}>
      <RowsContext.Provider value={true}>{children}</RowsContext.Provider>
    </div>
  )
}

export function Row({
  label,
  children,
  tip,
  className
}: {
  label: ReactNode
  children: ReactNode
  tip?: string
  className?: string
}): React.ReactElement {
  const id = useId()
  const field = useMemo(() => ({ id, description: tip }), [id, tip])
  const fitted = useContext(RowsContext)
  return (
    <div className={cn(fitted ? 'col-span-full grid grid-cols-subgrid' : 'flex gap-2', 'min-h-6 items-center', className)}>
      <span id={id} className={cn('truncate text-xs text-muted', fitted ? 'min-w-[76px]' : 'w-[76px] shrink-0')} data-tip={tip}>
        {label}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <FieldLabelContext.Provider value={field}>{children}</FieldLabelContext.Provider>
      </div>
    </div>
  )
}

