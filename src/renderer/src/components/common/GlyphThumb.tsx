import { memo } from 'react'
import { useDocStore } from '../../stores/doc-store'
import { GlyphCanvas } from '../canvas/GlyphCanvas'
import { advanceWidth } from '../../core/compute'
import { glyphSpokenName } from '../../core/unicode'
import { keyToDisplayChars } from '../../core/unicode-keys'
import { cn } from '../../lib/cn'

/** Small glyph preview for a key (falls back to the system character). */
export const GlyphThumb = memo(function GlyphThumb({
  unicode,
  size = 28,
  className,
  onClick,
  tip,
  ariaLabel
}: {
  unicode: string | null
  size?: number
  className?: string
  onClick?: () => void
  tip?: string
  /** Name of the thumbnail button (with onClick); defaults to the glyph's spoken name. */
  ariaLabel?: string
}): React.ReactElement {
  const family = useDocStore((s) => s.data?.family)
  const exists = useDocStore((s) => (unicode ? s.data?.glyphs.has(unicode) : false))
  const c = useDocStore((s) => (unicode ? s.computed.get(unicode)?.[0] : undefined))
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      data-tip={tip}
      // As a button it shows only a canvas, which has no text to name it.
      aria-label={onClick ? (ariaLabel ?? (unicode ? glyphSpokenName(unicode) : tip)) : undefined}
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded border border-line bg-slot',
        onClick && 'transition-colors hover:border-accent',
        className
      )}
      style={{ width: size, height: size }}
    >
      {exists && c && family ? (
        <GlyphCanvas path={c.path} advance={advanceWidth(c, family)} family={family.values} width={size - 2} height={size - 2} mode="mini" empty={c.empty} />
      ) : (
        <span className="text-subtle" style={{ fontSize: size * 0.5, lineHeight: 1 }}>
          {unicode ? keyToDisplayChars(unicode) || '?' : '—'}
        </span>
      )}
    </Tag>
  )
})
