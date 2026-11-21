// ============================================================
// Outline editor window: edits the imported shape of the active glyph in place, floating
// over the app so the grid and the text preview stay in view.
//
// This file is the window and what it says when a glyph has nothing to edit (for a glyph
// drawn by components, the glyphs to edit instead, one press away); the drawing
// area (and the vector library it needs) loads when a glyph with an outline is shown.
// ============================================================

import { Suspense, lazy, useEffect, useMemo, useRef } from 'react'
import { Lock, LockOpen } from 'lucide-react'
import { useDocStore } from '../../stores/doc-store'
import { componentKeys, resolveTarget, useOutlineEditorStore, type TargetState } from '../../stores/outline-editor-store'
import { useSelectionStore } from '../../stores/selection-store'
import { OUTLINE_WINDOW, usePrefsStore } from '../../stores/prefs-store'
import { closeOutlineEditor, openOutlineEditor } from '../../app/outline'
import { createMissing } from '../../app/actions'
import { pickSvgForGlyph } from '../../app/imports'
import { glyphSpokenName } from '../../core/unicode'
import { glyphLabel } from '../../core/unicode-keys'
import { useUnicodeDb } from '../../hooks/doc'
import { cn } from '../../lib/cn'
import { GlyphThumb } from '../common/GlyphThumb'
import { Boundary } from '../ui/Boundary'
import { Button, IconButton } from '../ui/Button'
import { FloatingWindow, type FloatingRect } from '../ui/FloatingWindow'
import { focusFallback } from '../ui/focus'
import { toast } from '../ui/Overlays'
import { t, useTranslation } from '../../i18n'

const OutlineEditorBody = lazy(() => import('./OutlineEditorBody'))

/** The editor window, when it is open and a font is shown. */
export function OutlineEditorHost(): React.ReactElement | null {
  const open = useOutlineEditorStore((s) => s.open)
  const hasDoc = useDocStore((s) => !!s.data)
  if (!open || !hasDoc) return null
  return (
    // A failure in the editor closes it and says so: the rest of the window keeps working.
    <Boundary name="outline-editor" onError={editorFailed}>
      <OutlineEditorWindow />
    </Boundary>
  )
}

function editorFailed(): void {
  useOutlineEditorStore.getState().setOpen(false)
  toast.error(t('outline.failed'))
}

/** Where the window opens the first time: over the grid's right side, clear of the inspector. */
function defaultRect(vw: number, vh: number): FloatingRect {
  const inspector = usePrefsStore.getState().rightWidth
  const width = OUTLINE_WINDOW.width
  const height = Math.min(OUTLINE_WINDOW.height, vh - 96)
  return { x: Math.max(16, vw - inspector - width - 24), y: 64, width, height }
}

const MIN_SIZE = { width: OUTLINE_WINDOW.minWidth, height: OUTLINE_WINDOW.minHeight }

function OutlineEditorWindow(): React.ReactElement {
  const { t } = useTranslation()
  const docId = useDocStore((s) => s.docId)
  const glyphs = useDocStore((s) => s.data?.glyphs)
  const computed = useDocStore((s) => s.computed)
  const active = useSelectionStore((s) => s.active)
  const lock = useOutlineEditorStore((s) => s.locks.get(docId))
  const rect = usePrefsStore((s) => s.outlineRect)
  const target = useMemo(() => resolveTarget(lock, active, glyphs, computed), [lock, active, glyphs, computed])
  const { key, locked, state } = target
  const label = key ? glyphLabel(key) : ''

  return (
    <FloatingWindow
      title={
        <>
          {key ? t('outline.title', { glyph: label }) : t('outline.titleNone')}
          {locked && <span className="sr-only"> ({t('outline.lock.locked')})</span>}
        </>
      }
      rect={rect}
      defaultRect={defaultRect}
      min={MIN_SIZE}
      onRectChange={(r) => usePrefsStore.getState().set('outlineRect', r)}
      onClose={() => closeOutlineEditor(document.querySelector<HTMLElement>('[data-outline-editor]'))}
      labels={{ close: t('outline.window.close'), move: t('outline.window.move'), resize: t('outline.window.resize') }}
      headerActions={
        <IconButton
          icon={locked ? Lock : LockOpen}
          tip={locked ? t('outline.lock.off') : t('outline.lock.on')}
          aria-pressed={locked}
          active={locked}
          disabled={!key}
          // Unlocked, the editor goes to the active glyph at once.
          onClick={() => useOutlineEditorStore.getState().setLock(docId, locked ? null : key)}
        />
      }
    >
      <div data-outline-editor className="flex min-h-0 flex-1 flex-col">
        {state === 'ok' && key ? (
          <Suspense fallback={<div className="flex-1 bg-slot" />}>
            {/* Another glyph is another editor: its points, its view. */}
            <OutlineEditorBody key={`${docId}:${key}`} docId={docId} glyphKey={key} />
          </Suspense>
        ) : (
          <NothingToEdit state={state} glyphKey={key} />
        )}
      </div>
    </FloatingWindow>
  )
}

const MESSAGES = {
  none: 'outline.states.none',
  missing: 'outline.states.missing',
  empty: 'outline.states.empty',
  components: 'outline.states.components',
  unfit: 'outline.states.unfit'
} as const satisfies Record<Exclude<TargetState, 'ok'>, string>

/** What the window says of a glyph without an outline to edit, with the way out when there is one. */
function NothingToEdit({ state, glyphKey }: { state: TargetState; glyphKey: string | null }): React.ReactElement {
  const { t } = useTranslation()
  const box = useRef<HTMLDivElement>(null)
  // A tile was pressed and is gone with its glyph: focus goes to what the window offers for
  // the next one (its own tiles, a button), else back to the grid. A glyph with an outline
  // takes focus in its drawing area.
  const followFocus = useRef(false)
  useEffect(() => {
    if (!followFocus.current) return
    followFocus.current = false
    const next = box.current?.querySelector<HTMLElement>('button')
    if (next) next.focus({ preventScroll: true })
    else focusFallback()
  }, [glyphKey])
  if (state === 'ok') return <div className="flex-1 bg-slot" />
  return (
    // Scrolls when a glyph has more components than the window shows.
    <div className="flex min-h-0 flex-1 overflow-y-auto bg-slot p-6">
      <div ref={box} className="m-auto flex max-w-full flex-col items-center gap-3 text-center">
        <p className="max-w-xs text-sm text-muted">{t(MESSAGES[state], { glyph: glyphKey ? glyphLabel(glyphKey) : '' })}</p>
        {state === 'missing' && glyphKey && <Button onClick={() => void createMissing([glyphKey])}>{t('inspector.emptySlot.createEmpty')}</Button>}
        {state === 'empty' && glyphKey && <Button onClick={() => void pickSvgForGlyph(glyphKey)}>{t('inspector.emptySlot.importSvg')}</Button>}
        {state === 'components' && glyphKey && (
          <ComponentTiles
            glyphKey={glyphKey}
            onPick={(key) => {
              followFocus.current = true
              openOutlineEditor(key)
            }}
          />
        )}
      </div>
    </div>
  )
}

/** The glyphs a glyph is drawn with, one tile each: a press shows that glyph in the editor. */
function ComponentTiles({ glyphKey, onPick }: { glyphKey: string; onPick: (key: string) => void }): React.ReactElement | null {
  const { t } = useTranslation()
  const glyphs = useDocStore((s) => s.data?.glyphs)
  const layers = glyphs?.get(glyphKey)?.variants[0].layers
  const keys = useMemo(() => componentKeys(glyphKey, layers), [glyphKey, layers])
  // The tiles' names say the Unicode names once they are loaded.
  useUnicodeDb()
  if (!keys.length) return null
  return (
    <div role="group" aria-label={t('outline.components.list')} className="flex max-w-full flex-wrap justify-center gap-2">
      {keys.map((key) => {
        const message = glyphs?.has(key) ? 'outline.components.edit' : 'outline.components.missing'
        return (
          <button
            key={key}
            type="button"
            aria-label={t(message, { glyph: glyphSpokenName(key) })}
            data-tip={t(message, { glyph: glyphLabel(key) })}
            onClick={() => onPick(key)}
            className={cn(
              'flex w-[76px] flex-col items-center gap-1.5 rounded-md border border-line bg-panel p-1.5 transition-colors hover:border-accent',
              message === 'outline.components.missing' && 'opacity-60 hover:opacity-100'
            )}
          >
            <GlyphThumb unicode={key} size={62} />
            <span className="w-full truncate text-sm leading-none text-fg">{glyphLabel(key)}</span>
          </button>
        )
      })}
    </div>
  )
}
