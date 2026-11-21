// ============================================================
// Glyph inspector: the glyph's kerning pairs, editable in place,
// a field to add one, (with inheritance) the pairs an accented
// letter follows from its base letter, and the pairs its outlines
// suggest kerning for.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowUpRight, FoldHorizontal, Plus, Wand2, X } from 'lucide-react'
import { useDocStore, transact } from '../../stores/doc-store'
import { useInspectorStore } from '../../stores/inspector-store'
import { Disclosure, Section, SubHeader } from '../ui/Section'
import { Button, IconButton } from '../ui/Button'
import { NumberField, Segmented, formatNumber } from '../ui/fields'
import { focusFallback, keepTypingKeys } from '../ui/focus'
import { toast } from '../ui/Overlays'
import { PairCanvas } from '../canvas/PairCanvas'
import { setGlyph } from '../viewport/PairSlot'
import { setKerning } from '../../core/ops'
import { baseGlyph, inheritedFrom, inheritingPairs, pairKern, pairKey, pairLabel, pairSides, pairsOfGlyph, replacingLigature } from '../../core/kerning'
import { glyphLabel, parseUserKey } from '../../core/unicode-keys'
import { applySuggestions, followBase, removePairs, setPairValues, showPairs } from '../../app/kerning'
import { detectedPairs, useKernSuggestions } from '../../app/kern-suggestions'
import { formatNumber as formatCount, useTranslation } from '../../i18n'

/** Suggested pairs listed here; the Detected view shows them all. */
const SUGGESTED_ROWS = 12

export function KerningSection({ unicode }: { unicode: string }): React.ReactElement {
  const { t } = useTranslation()
  const kerning = useDocStore((s) => s.data!.kerning)
  const inherit = useDocStore((s) => s.data!.inheritKerning)
  // Only the set of glyphs matters (not their outlines): edits to glyphs do not redo this.
  const glyphCount = useDocStore((s) => s.data!.glyphs.size)
  const [showInherited, setShowInherited] = useState(false)
  const [showSuggested, setShowSuggested] = useState(false)
  const { left, right } = useMemo(() => pairsOfGlyph(kerning, unicode), [kerning, unicode])
  const all = useMemo(() => [...new Set([...left, ...right])], [left, right])
  // With inheritance: who follows each pair, and the pairs this glyph follows (an accented letter).
  const followers = useMemo(
    () => (inherit ? inheritingPairs(kerning, useDocStore.getState().data!.glyphs.keys()) : new Map<string, string[]>()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inherit, kerning, glyphCount]
  )
  const inherited = useMemo(() => {
    if (!baseGlyph(unicode)) return []
    const out: string[] = []
    for (const keys of followers.values()) for (const k of keys) if (pairSides(k).includes(unicode)) out.push(k)
    return out
  }, [followers, unicode])
  // The common pairs with this glyph that its outlines suggest kerning for (not kerned yet).
  const docId = useDocStore((s) => s.docId)
  const suggestions = useKernSuggestions((s) => (s.docId === docId ? s.map : null))
  const suggested = useMemo(
    () => (suggestions ? detectedPairs(suggestions, kerning, inherit, false).filter((k) => pairSides(k).includes(unicode)) : []),
    [suggestions, kerning, inherit, unicode]
  )
  const label = glyphLabel(unicode)
  return (
    <Section
      id="inspector.kerning"
      title={t('inspector.kerning')}
      icon={FoldHorizontal}
      badge={all.length + inherited.length || undefined}
      actions={
        all.length > 0 && <IconButton icon={ArrowUpRight} size="xs" tip={t('inspector.kerningSection.showPairs')} onClick={() => showPairs(all)} />
      }
    >
      {left.length > 0 && (
        <>
          <SubHeader>{t('inspector.kerningSection.asLeft', { glyph: label })}</SubHeader>
          {left.map((k) => (
            <PairRow key={k} pair={k} followers={followers.get(k)} />
          ))}
        </>
      )}
      {right.length > 0 && (
        <>
          <SubHeader>{t('inspector.kerningSection.asRight', { glyph: label })}</SubHeader>
          {right.map((k) => (
            <PairRow key={k} pair={k} followers={followers.get(k)} />
          ))}
        </>
      )}
      {inherited.length > 0 && (
        <>
          <Disclosure open={showInherited} onToggle={() => setShowInherited(!showInherited)}>
            {t('inspector.kerningSection.inheritedFrom', { glyph: glyphLabel(baseGlyph(unicode)!), n: inherited.length })}
          </Disclosure>
          {showInherited && inherited.map((k) => <PairRow key={k} pair={k} />)}
        </>
      )}
      {all.length === 0 && inherited.length === 0 && <p className="text-xs text-subtle">{t('inspector.kerningSection.none', { glyph: label })}</p>}
      {suggested.length > 0 && suggestions && (
        <>
          <Disclosure open={showSuggested} onToggle={() => setShowSuggested(!showSuggested)} dot>
            {t('inspector.kerningSection.suggested', { n: suggested.length })}
          </Disclosure>
          {showSuggested && (
            <>
              {suggested.slice(0, SUGGESTED_ROWS).map((k) => (
                <SuggestedRow key={k} pair={k} value={suggestions.get(k)!} />
              ))}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <Button size="xs" icon={Wand2} onClick={() => applySuggestions(suggested)} tip={t('inspector.kerningSection.applySuggestedTip')}>
                  {suggested.length === 1 ? t('inspector.kerningSection.applyIt') : t('inspector.kerningSection.applyAll', { n: suggested.length })}
                </Button>
                <Button size="xs" variant="ghost" onClick={() => showPairs(suggested, { view: { kind: 'detected' } })}>
                  {t('inspector.kerningSection.showInDetected')}
                </Button>
              </div>
            </>
          )}
        </>
      )}
      <AddPairRow glyph={unicode} />
    </Section>
  )
}

/**
 * One pair: its proof, its value (inherited values show like linked fields: typing gives
 * the pair its own), and how many accented pairs follow it.
 */
function PairRow({ pair, followers }: { pair: string; followers?: string[] }): React.ReactElement {
  const { t } = useTranslation()
  const [left, right] = pairSides(pair)
  const kerning = useDocStore((s) => s.data!.kerning)
  const inherit = useDocStore((s) => s.data!.inheritKerning)
  const family = useDocStore((s) => s.data!.family)
  const hasLeft = useDocStore((s) => s.data!.glyphs.has(left))
  const hasRight = useDocStore((s) => s.data!.glyphs.has(right))
  const cLeft = useDocStore((s) => s.computed.get(left)?.[0])
  const cRight = useDocStore((s) => s.computed.get(right)?.[0])
  const ligature = useDocStore((s) => replacingLigature(pair, (k) => s.data!.glyphs.has(k)))
  const label = pairLabel(pair)
  const box = useRef<HTMLDivElement>(null)
  const k = pairKern(kerning, pair, inherit)
  const own = kerning.get(pair)
  // The base letters' pair it follows, or would follow without a value of its own.
  const from = inherit ? inheritedFrom(kerning, pair) : null

  // A pair just added here: its value field takes the keys.
  const pairFocus = useInspectorStore((s) => s.pairFocus)
  useEffect(() => {
    if (pairFocus !== pair) return
    useInspectorStore.getState().focusPair(null)
    const input = box.current?.querySelector('input')
    input?.focus()
    input?.select()
  }, [pairFocus, pair])

  const warning =
    !hasLeft || !hasRight
      ? t('inspector.kerningSection.notInFont', { glyph: glyphLabel(hasLeft ? right : left) })
      : ligature
        ? t('inspector.kerningSection.replacedByLigature', { glyph: glyphLabel(ligature) })
        : null
  return (
    <div ref={box} className="flex h-8 items-center gap-2">
      <button
        type="button"
        onClick={() => showPairs([pair])}
        data-tip={t('inspector.kerningSection.showInKerning')}
        aria-label={t('inspector.kerningSection.showPairInKerning', { pair: label })}
        className="shrink-0 overflow-hidden rounded border border-line bg-slot transition-colors hover:border-accent"
      >
        <PairCanvas
          glyphs={[setGlyph(left, cLeft, family, hasLeft), setGlyph(right, cRight, family, hasRight)]}
          kerns={[k.value]}
          mark={0}
          markInherited={k.state === 'inherited'}
          family={family.values}
          width={54}
          height={26}
          mode="mini"
          faded={!hasLeft || !hasRight}
        />
      </button>
      <span className="min-w-0 flex-1 truncate text-sm text-fg">{label}</span>
      {followers && followers.length > 0 && (
        <span
          className="shrink-0 rounded bg-hover px-1 text-2xs text-muted"
          data-tip={t('inspector.kerningSection.alsoApplies', { pairs: followers.map(pairLabel).join(' ') })}
          aria-label={t('inspector.kerningSection.alsoAppliesCount', { count: followers.length })}
          role="img"
        >
          +{formatCount(followers.length)}
        </span>
      )}
      {warning && <AlertTriangle size={12} className="shrink-0 text-warn" data-tip={warning} aria-label={warning} role="img" />}
      <div className="w-[76px] shrink-0">
        <NumberField
          value={own ?? null}
          inherited={from ? kerning.get(from)! : 0}
          linkable={!!from}
          precision={2}
          ariaLabel={t('inspector.kerningSection.kerningOf', { pair: label })}
          onChange={(v, m) => (v === null ? followBase([pair]) : setPairValues([pair], v, m.interactive))}
        />
      </div>
      <IconButton
        icon={X}
        size="xs"
        tip={own === undefined ? t('inspector.kerningSection.followsBase', { pair: label }) : t('inspector.kerningSection.remove', { pair: label })}
        disabled={own === undefined}
        onClick={() => {
          removePairs([pair])
          // The row goes with the pair.
          focusFallback()
        }}
      />
    </div>
  )
}

/** A pair not kerned yet that the outlines suggest a value for: its proof, the value, Apply. */
function SuggestedRow({ pair, value }: { pair: string; value: number }): React.ReactElement {
  const { t } = useTranslation()
  const [left, right] = pairSides(pair)
  const family = useDocStore((s) => s.data!.family)
  const cLeft = useDocStore((s) => s.computed.get(left)?.[0])
  const cRight = useDocStore((s) => s.computed.get(right)?.[0])
  const label = pairLabel(pair)
  const amount = formatNumber(value, 2)
  return (
    <div className="flex h-8 items-center gap-2">
      <button
        type="button"
        onClick={() => showPairs([pair], { view: { kind: 'detected' } })}
        data-tip={t('inspector.kerningSection.showInDetected')}
        aria-label={t('inspector.kerningSection.showPairInDetected', { pair: label })}
        className="shrink-0 overflow-hidden rounded border border-line bg-slot transition-colors hover:border-accent"
      >
        <PairCanvas
          glyphs={[setGlyph(left, cLeft, family, true, true), setGlyph(right, cRight, family, true, true)]}
          kerns={[0]}
          mark={0}
          hint={value}
          family={family.values}
          width={54}
          height={26}
          mode="mini"
        />
      </button>
      <span className="min-w-0 flex-1 truncate text-sm text-muted">{label}</span>
      <span className="shrink-0 font-mono text-xs text-muted">≈ {amount}</span>
      <Button
        size="xs"
        icon={Wand2}
        tip={t('inspector.kerningSection.giveMeasured', { pair: label })}
        aria-label={t('inspector.kerningSection.applyTo', { value: amount, pair: label })}
        onClick={() => applySuggestions([pair])}
      >
        {t('inspector.kerningSection.apply')}
      </Button>
    </div>
  )
}

/** Add a pair with this glyph: type the other glyph, choose the side. */
function AddPairRow({ glyph }: { glyph: string }): React.ReactElement {
  const [text, setText] = useState('')
  const { t } = useTranslation()
  const [side, setSide] = useState<'first' | 'second'>('first')
  const label = glyphLabel(glyph)
  const add = (): void => {
    const other = parseUserKey(text)
    if (!other) {
      toast.info(t('inspector.kerningSection.typeOther'), t('inspector.kerningSection.typeOtherHint'))
      return
    }
    const key = side === 'first' ? pairKey(glyph, other) : pairKey(other, glyph)
    if (useDocStore.getState().data?.kerning.has(key)) {
      toast.info(t('inspector.kerningSection.alreadyPair', { pair: pairLabel(key) }))
    } else {
      transact(t('inspector.history.addPair', { pair: pairLabel(key) }), (d) => {
        setKerning(d, [[key, 0]])
      }, { icon: 'kerning' })
    }
    setText('')
    useInspectorStore.getState().focusPair(key)
  }
  return (
    <div className="flex items-center gap-1.5 pt-1.5">
      <Segmented
        ariaLabel={t('inspector.kerningSection.side', { glyph: label })}
        value={side}
        onChange={setSide}
        options={[
          { value: 'first', label: t('inspector.kerningSection.first', { glyph: label }), tip: t('inspector.kerningSection.firstTip', { glyph: label }) },
          { value: 'second', label: t('inspector.kerningSection.second', { glyph: label }), tip: t('inspector.kerningSection.secondTip', { glyph: label }) }
        ]}
      />
      <input
        type="text"
        value={text}
        spellCheck={false}
        placeholder={t('inspector.kerningSection.otherPlaceholder')}
        aria-label={side === 'first' ? t('inspector.kerningSection.glyphAfter', { glyph: label }) : t('inspector.kerningSection.glyphBefore', { glyph: label })}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add()
          }
          keepTypingKeys(e)
        }}
        className="input-base h-6 min-w-0 flex-1"
      />
      <IconButton icon={Plus} variant="default" tip={t('inspector.kerningSection.addPair')} disabled={!text.trim()} onClick={add} />
    </div>
  )
}
