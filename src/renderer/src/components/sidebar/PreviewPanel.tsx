// ============================================================
// Text preview (v1 pangram): renders the font being edited live.
// Characters of the selected glyphs are highlighted in the text, and text
// selected with the mouse becomes the glyph selection (v1's way to inspect
// a word, and what the ligature buttons build from).
// ============================================================

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  AlertTriangle,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  CaseLower,
  CaseSensitive,
  CaseUpper,
  FoldHorizontal,
  Ligature,
  Plus,
  RefreshCw,
  RemoveFormatting,
  RotateCcw,
  Type
} from 'lucide-react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useDocStore } from '../../stores/doc-store'
import { useSelectionStore } from '../../stores/selection-store'
import { openStores, useWorkspace } from '../../stores/workspace'
import { collectExportGlyphs, buildOTF } from '../../core/export-font'
import { kerningForExport, pairKern, pairKey } from '../../core/kerning'
import { charsToKey, codePointToKey, keyToChars, keyToCodePoints } from '../../core/unicode-keys'
import { addPair } from '../../app/kerning'
import { formatNumber } from '../ui/fields'
import { errorMessage } from '../../lib/errors'
import { PanelHeader } from './PanelHeader'
import { Button, IconButton } from '../ui/Button'
import { Segmented, Slider } from '../ui/fields'
import { createLigature } from '../../app/actions'
import { cn } from '../../lib/cn'
import { keepTypingKeys } from '../ui/focus'
import { useTranslation } from '../../i18n'

interface PreviewSettings {
  /** null: the default sentence, in the app's language (each language has its own pangram). */
  text: string | null
  size: number
  lineHeight: number
  align: 'left' | 'center' | 'right' | 'justify'
  direction: 'ltr' | 'rtl'
  textCase: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  set: (p: Partial<Omit<PreviewSettings, 'set'>>) => void
}

const usePreviewSettings = create<PreviewSettings>()(
  persist(
    (set) => ({
      text: null,
      size: 40,
      lineHeight: 1.25,
      align: 'left',
      direction: 'ltr',
      textCase: 'none',
      set: (p) => set(p)
    }),
    { name: 'mkfont.preview', partialize: ({ set: _s, ...rest }) => rest }
  )
)

let fontSerial = 0

/** Code points the preview can show: the text in every form the case option produces. */
function previewCodePoints(text: string): number[] {
  const out = new Set<number>()
  for (const s of [text, text.toUpperCase(), text.toLowerCase()]) {
    for (const ch of s) out.add(ch.codePointAt(0)!)
  }
  return [...out].sort((a, b) => a - b)
}

const words = new Intl.Segmenter(undefined, { granularity: 'word' })

/**
 * The text as the preview shows it. The case is applied here rather than with CSS
 * `text-transform`, so the DOM holds the characters on screen: highlights, faded
 * characters and text selections all work on what the user sees.
 */
function applyCase(text: string, textCase: PreviewSettings['textCase']): string {
  if (textCase === 'uppercase') return text.toUpperCase()
  if (textCase === 'lowercase') return text.toLowerCase()
  if (textCase !== 'capitalize') return text
  // CSS `capitalize`: the first letter of each word, cut on ICU word breaks like Chromium.
  let out = ''
  for (const { segment } of words.segment(text)) {
    const first = String.fromCodePoint(segment.codePointAt(0)!)
    out += first.toUpperCase() + segment.slice(first.length)
  }
  return out
}

/** The selected text inside `el`, or '' when there is none. A drag can end outside the element. */
function selectedTextIn(el: HTMLElement): string {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || !sel.rangeCount) return ''
  const range = sel.getRangeAt(0).cloneRange()
  const inside = document.createRange()
  inside.selectNodeContents(el)
  if (range.compareBoundaryPoints(Range.START_TO_START, inside) < 0) range.setStart(inside.startContainer, inside.startOffset)
  if (range.compareBoundaryPoints(Range.END_TO_END, inside) > 0) range.setEnd(inside.endContainer, inside.endOffset)
  return range.toString()
}

/**
 * The selected glyphs' characters in selection order (v1), optionally separated by spaces.
 * Control characters stay out of the text; format characters such as ZWJ stay in, as
 * emoji and ligature sequences need them.
 */
function selectionText(spaced: boolean): string {
  return useSelectionStore
    .getState()
    .keys.map((key) => keyToChars(key).replace(/\p{Cc}/gu, ''))
    .filter(Boolean)
    .join(spaced ? ' ' : '')
}

/** At most `max` characters, cut with an ellipsis. */
function clip(text: string, max: number): string {
  const chars = Array.from(text)
  return chars.length > max ? `${chars.slice(0, max - 1).join('')}…` : text
}

/**
 * Characters of the selected glyphs: v1's rounded accent box, keeping the glyph color,
 * which reads at 6:1 or more on it in both themes (v1's white text fails on the light one).
 */
const HIGHLIGHT = 'rounded-[0.1em] bg-accent/40 box-decoration-clone'

/**
 * A document's last preview build: its last good font (no face: none built yet, or the
 * text uses none of its glyphs), and why its latest build failed.
 */
interface PreviewFont {
  docId: number
  face: FontFace | null
  family: string | null
  error: string | null
}

/**
 * Builds the live preview font and registers it with document.fonts. Only the
 * glyphs the text uses (and ligatures made of them) go in, so a rebuild costs
 * the same on a 50-glyph font and on a 50,000-glyph one.
 */
function usePreviewFont(text: string): { family: string | null; building: boolean; error: string | null; refresh: () => void } {
  // Open fonts can be at the same revision: switching to another one rebuilds too.
  const docId = useDocStore((s) => s.docId)
  const revision = useDocStore((s) => s.revision)
  // The last build of each open document, so switching back to one shows its font at once
  // instead of the fallback font until it is rebuilt.
  const [fonts, setFonts] = useState<PreviewFont[]>([])
  const [building, setBuilding] = useState(false)
  const [manual, setManual] = useState(0)
  const latestBuild = useRef(0)
  // Never another document's font or error, not even until this one's is built.
  const font = fonts.find((f) => f.docId === docId)
  // Whether this document shows a build of its own, for the build effect (which must not
  // rerun when a build lands).
  const hasOwnBuild = useRef(false)
  hasOwnBuild.current = font !== undefined
  // Unchanged while the set of characters is unchanged: retyping letters does not rebuild.
  const signature = useMemo(() => previewCodePoints(text).join(','), [text])

  // A font closed in a background tab lets go of its face now, not at the next build.
  const sessions = useWorkspace((s) => s.sessions)
  useEffect(() => {
    const open = new Set(openStores().map((store) => store.getState().docId))
    setFonts((all) => (all.every((f) => open.has(f.docId)) ? all : all.filter((f) => open.has(f.docId))))
  }, [sessions])

  // Each document's face stays registered while it is kept, for when the document is shown
  // again. Swapped before paint, so the text never shows a family that is not registered.
  useLayoutEffect(() => {
    const faces = fonts.flatMap((f) => (f.face ? [f.face] : []))
    for (const face of faces) document.fonts.add(face)
    return () => {
      for (const face of faces) document.fonts.delete(face)
    }
  }, [fonts])

  useEffect(() => {
    const run = async (): Promise<void> => {
      const s = useDocStore.getState()
      if (!s.data) return
      const build = ++latestBuild.current
      const needed = new Set(signature ? signature.split(',').map(Number) : [])
      const include = (key: string): boolean => keyToCodePoints(key).every((cp) => needed.has(cp))
      // Replaces the document's last build. Documents closed since go, this one too if it
      // closed while its font loaded.
      const keep = (update: (last: PreviewFont | undefined) => PreviewFont): void => {
        const open = new Set(openStores().map((store) => store.getState().docId))
        setFonts((all) => {
          const next = update(all.find((f) => f.docId === s.docId))
          return [...all.filter((f) => f.docId !== s.docId), next].filter((f) => open.has(f.docId))
        })
      }
      setBuilding(true)
      try {
        const { list } = collectExportGlyphs(s.data.family, s.data.glyphs, s.computed, include)
        let face: FontFace | null = null
        let name: string | null = null
        if (list.length) {
          name = `mkf-preview-${++fontSerial}`
          // Kerning pairs of glyphs left out of the subset are skipped by the export.
          const kerning = kerningForExport(s.data.kerning, list.map((g) => g.key), s.data.inheritKerning)
          face = new FontFace(name, buildOTF(s.data.family, list, kerning))
          await face.load()
        }
        // A newer build started while this one loaded, or the panel closed: let it go.
        if (build !== latestBuild.current) return
        keep(() => ({ docId: s.docId, face, family: name, error: null }))
      } catch (e) {
        if (build !== latestBuild.current) return
        // Keep showing the last good font, and say why it is not updating.
        const error = errorMessage(e)
        keep((last) => ({ docId: s.docId, face: null, family: null, ...last, error }))
      } finally {
        if (build === latestBuild.current) setBuilding(false)
      }
    }
    // Edits and typing wait for a pause. A document showing no build of its own yet (the
    // first one, or a font switched to before it was built) builds at once: its text is in
    // the fallback font until then.
    const timer = window.setTimeout(run, hasOwnBuild.current ? 150 : 0)
    return () => window.clearTimeout(timer)
  }, [docId, revision, signature, manual])

  useEffect(
    () => () => {
      // Builds still loading when the panel closes are dropped with their face.
      latestBuild.current++
    },
    []
  )

  return {
    family: font?.family ?? null,
    building,
    error: font?.error ?? null,
    refresh: () => setManual((m) => m + 1)
  }
}

export function PreviewPanel(): React.ReactElement {
  const { t } = useTranslation()
  const p = usePreviewSettings()
  const defaultText = t('sidebar.preview.defaultText')
  const text = p.text ?? defaultText
  const { family, building, error, refresh } = usePreviewFont(text)
  const docId = useDocStore((s) => s.docId)
  const glyphs = useDocStore((s) => s.data!.glyphs)
  const selected = useSelectionStore((s) => s.set)
  const textRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const textFieldId = useId()
  // Text picked in the preview, for the ligature buttons. It belongs to the font it
  // was picked in (v1 dropped it when the font changed).
  const [picked, setPicked] = useState({ docId, text: '' })
  const ligaText = picked.docId === docId ? picked.text : ''
  const ligaReady = Array.from(ligaText).length >= 2
  // Two characters picked: they can be kerned.
  const kernKeys = Array.from(ligaText).length === 2 ? Array.from(ligaText).map((c) => charsToKey(c)) : null
  // The value that applies, inherited included (a number: selectors must not build objects).
  const kernValue = useDocStore((s) => {
    if (!kernKeys || !s.data) return undefined
    const k = pairKern(s.data.kerning, pairKey(kernKeys[0], kernKeys[1]), s.data.inheritKerning)
    return k.state === 'none' ? undefined : k.value
  })

  const shown = useMemo(() => applyCase(text, p.textCase), [text, p.textCase])

  // Runs of alike characters: plain, highlighted (a selected glyph), faded (not in the font).
  const rendered = useMemo(() => {
    const out: React.ReactNode[] = []
    let run = ''
    let runHi = false
    let runMissing = false
    const flush = (): void => {
      if (run) out.push(runHi || runMissing ? <span key={out.length} className={cn(runHi && HIGHLIGHT, runMissing && 'text-glyph/30')}>{run}</span> : run)
      run = ''
    }
    for (const ch of shown) {
      if (ch === '\n') {
        flush()
        out.push(<br key={out.length} />)
        continue
      }
      const key = codePointToKey(ch.codePointAt(0)!)
      const hi = selected.has(key)
      const missing = ch !== ' ' && !glyphs.has(key)
      if (hi !== runHi || missing !== runMissing) {
        flush()
        runHi = hi
        runMissing = missing
      }
      run += ch
    }
    flush()
    return out
  }, [shown, glyphs, selected])

  /** v1: text selected in the preview becomes the glyph selection, in text order, missing glyphs included. */
  const pickSelectedText = (): void => {
    const text = textRef.current ? selectedTextIn(textRef.current) : ''
    if (!text) return
    window.getSelection()?.removeAllRanges()
    const chars = text.replace(/\s+/g, '')
    if (!chars) return
    const keys = [...new Set(Array.from(chars, (ch) => codePointToKey(ch.codePointAt(0)!)))]
    setPicked({ docId: useDocStore.getState().docId, text: chars })
    useSelectionStore.getState().setSelection(keys, keys[keys.length - 1])
  }

  // v1's footer buttons, Shift separating the characters with spaces. The keys typed next
  // edit the text, after its end: on the button the mouse pressed, Backspace would delete
  // the selected glyphs (and the reset button disables itself).
  const putText = (next: string | null, reset = false): void => {
    // On screen at once, so the caret can go after it.
    if (next || reset) flushSync(() => p.set({ text: reset ? null : next }))
    const el = fieldRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
    // The end of a text taller than the field is out of sight otherwise.
    el.scrollTop = el.scrollHeight
  }
  const appendSelection = (spaced: boolean): void => {
    const added = selectionText(spaced)
    const gap = spaced && text && !/\s$/.test(text) ? ' ' : ''
    putText(added ? text + gap + added : null)
  }
  const replaceWithSelection = (spaced: boolean): void => putText(selectionText(spaced) || null)

  // The selection is read once the drag ends, wherever the mouse is then: acting
  // mid-drag would re-render the highlights under the user's selection.
  const stopDrag = useRef<(() => void) | null>(null)
  useEffect(() => () => stopDrag.current?.(), [])
  const onTextMouseDown = (e: React.MouseEvent): void => {
    if (e.button !== 0) return
    stopDrag.current?.()
    const onUp = (): void => {
      stopDrag.current?.()
      pickSelectedText()
    }
    window.addEventListener('mouseup', onUp)
    stopDrag.current = () => {
      window.removeEventListener('mouseup', onUp)
      stopDrag.current = null
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        title={t('sidebar.preview.title')}
        actions={<IconButton icon={RefreshCw} size="xs" tip={t('sidebar.preview.rebuild')} onClick={refresh} className={cn(building && 'animate-spin')} />}
      />
      {/* Scrolls only when the window is too short for the smallest preview plus the controls. */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
        {/* Takes the height the controls leave (v1), so editing the text never moves them. */}
        <div className="relative flex min-h-[120px] flex-1 flex-col rounded-md border border-line bg-slot">
          <div
            ref={textRef}
            role="region"
            aria-label={t('sidebar.preview.rendered')}
            // Focusable, so a long text can be scrolled from the keyboard.
            tabIndex={0}
            onMouseDown={onTextMouseDown}
            className="flex min-h-0 flex-1 cursor-text select-text flex-col overflow-y-auto overflow-x-hidden rounded-[5px] p-3"
          >
            {/* Auto margins centre a short text and let a long one scroll from its first line
                (justify-content: center would cut off its top). */}
            <div
              className="my-auto break-words text-glyph"
              style={{
                fontFamily: family ? `"${family}", "Adobe NotDef", sans-serif` : 'sans-serif',
                fontSize: p.size,
                lineHeight: p.lineHeight,
                textAlign: p.align,
                direction: p.direction,
                // The font's kerning pairs apply at every size.
                fontKerning: 'normal'
              }}
            >
              {rendered}
            </div>
          </div>
          {/* Over the preview's bottom edge, so it moves nothing; always mounted, so it is announced. */}
          <div aria-live="polite" className="pointer-events-none absolute inset-x-1.5 bottom-1.5">
            {error && (
              <p className="flex items-start gap-1.5 rounded bg-panel px-2 py-1 text-xs text-warn shadow-pop">
                <AlertTriangle size={13} className="mt-px shrink-0" />
                <span className="line-clamp-3 break-words">{t('sidebar.preview.notUpdating', { error })}</span>
              </p>
            )}
          </div>
        </div>
        {/* v1's order, at a fixed size. */}
        <div className="flex shrink-0 flex-col gap-2">
          <div className="flex gap-1.5">
            <Button
              icon={Ligature}
              disabled={!ligaReady}
              onClick={() => createLigature(ligaText)}
              tip={ligaReady ? t('sidebar.preview.ligatureTip') : undefined}
              className="min-w-0 flex-1"
            >
              <span className="truncate">{ligaReady ? t('sidebar.preview.ligature', { text: clip(ligaText, 10) }) : t('sidebar.preview.ligatureHint')}</span>
            </Button>
            <Button disabled={!ligaReady} onClick={() => createLigature(ligaText, true)} tip={t('sidebar.preview.withComponentsTip')}>
              {t('sidebar.preview.withComponents')}
            </Button>
          </div>
          <Button
            icon={FoldHorizontal}
            disabled={!kernKeys}
            onClick={() => kernKeys && addPair(kernKeys[0], kernKeys[1])}
            tip={kernKeys ? t('sidebar.preview.kernTip') : undefined}
          >
            <span className="truncate">
              {kernKeys ? t('sidebar.preview.kern', { text: ligaText }) : t('sidebar.preview.kernHint')}
              {kernValue !== undefined && <span className="ml-1.5 font-mono text-2xs opacity-80">{formatNumber(kernValue, 2)}</span>}
            </span>
          </Button>
          <div className="flex flex-wrap justify-between gap-1.5">
            <Segmented
              ariaLabel={t('sidebar.preview.alignment')}
              value={p.align}
              onChange={(align) => p.set({ align })}
              options={[
                { value: 'left', icon: AlignLeft, tip: t('sidebar.preview.alignLeft') },
                { value: 'center', icon: AlignCenter, tip: t('sidebar.preview.alignCenter') },
                { value: 'right', icon: AlignRight, tip: t('sidebar.preview.alignRight') },
                { value: 'justify', icon: AlignJustify, tip: t('sidebar.preview.justify') }
              ]}
            />
            <Segmented
              ariaLabel={t('sidebar.preview.direction')}
              value={p.direction}
              onChange={(direction) => p.set({ direction })}
              options={[
                { value: 'ltr', label: t('sidebar.preview.ltr'), tip: t('sidebar.preview.ltrTip') },
                { value: 'rtl', label: t('sidebar.preview.rtl'), tip: t('sidebar.preview.rtlTip') }
              ]}
            />
            <Segmented
              ariaLabel={t('sidebar.preview.textCase')}
              value={p.textCase}
              onChange={(textCase) => p.set({ textCase })}
              options={[
                { value: 'none', icon: RemoveFormatting, tip: t('sidebar.preview.asTyped') },
                { value: 'uppercase', icon: CaseUpper, tip: t('sidebar.preview.uppercase') },
                { value: 'lowercase', icon: CaseLower, tip: t('sidebar.preview.lowercase') },
                { value: 'capitalize', icon: CaseSensitive, tip: t('sidebar.preview.capitalize') }
              ]}
            />
          </div>
          <div className="grid grid-cols-[56px_1fr_36px] items-center gap-x-2 gap-y-1.5 text-xs text-muted">
            <span>{t('sidebar.preview.size')}</span>
            <Slider min={8} max={160} value={p.size} onChange={(v) => p.set({ size: v })} aria-label={t('sidebar.preview.size')} />
            <span className="text-right font-mono">{p.size}</span>
            <span>{t('sidebar.preview.leading')}</span>
            <Slider
              min={0.6}
              max={3}
              step={0.05}
              value={p.lineHeight}
              onChange={(v) => p.set({ lineHeight: v })}
              aria-label={t('sidebar.preview.leading')}
              aria-valuetext={p.lineHeight.toFixed(2)}
            />
            <span className="text-right font-mono">{p.lineHeight.toFixed(2)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-0.5">
              <label htmlFor={textFieldId} className="mr-auto text-xs text-muted">
                {t('sidebar.preview.text')}
              </label>
              <IconButton
                icon={RotateCcw}
                size="xs"
                tip={t('sidebar.preview.reset')}
                disabled={text === defaultText}
                onClick={() => putText(null, true)}
              />
              <IconButton
                icon={Plus}
                size="xs"
                tip={t('sidebar.preview.append')}
                disabled={!selected.size}
                onClick={(e) => appendSelection(e.shiftKey)}
              />
              <IconButton
                icon={Type}
                size="xs"
                tip={t('sidebar.preview.replace')}
                disabled={!selected.size}
                onClick={(e) => replaceWithSelection(e.shiftKey)}
              />
            </div>
            <textarea
              ref={fieldRef}
              id={textFieldId}
              value={text}
              onChange={(e) => p.set({ text: e.target.value })}
              onKeyDown={keepTypingKeys}
              rows={3}
              spellCheck={false}
              aria-label={t('sidebar.preview.field')}
              placeholder={t('sidebar.preview.placeholder')}
              // Fixed size: a long text scrolls inside the field instead of moving the panel.
              className="w-full resize-none rounded border border-line bg-raised px-2 py-1.5 text-sm text-fg outline-none placeholder:text-subtle focus:border-accent"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
