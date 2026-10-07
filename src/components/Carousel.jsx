import { useCallback, useEffect, useRef, useState } from 'react'

// Stock photos, so labels describe the type of work, not "our jobs" (the
// Pexels licence bars misleading use). Switch the home heading back to
// "Recent field work" once these are replaced with the client's own photos.
// Images are specific, curated photos from Pexels (free to use, no
// attribution required under the Pexels License: pexels.com/license).
// Each URL is pinned to one photo ID rather than a random keyword search,
// so the same relevant image always shows. Swap for real jobsite photos
// whenever the client has them, see README.md.
const slides = [
  {
    plate: 'Water damage',
    title: 'Water damage, documented room by room',
    body: 'Moisture readings, affected materials, and drying equipment logged to Xactimate line-item standard.',
    img: 'https://images.pexels.com/photos/18302377/pexels-photo-18302377.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&fit=crop',
  },
  {
    plate: 'Measurements',
    title: 'Floor plans and measurements',
    body: 'Sketches and room measurements built from your photos, scans, and notes, cross-checked against carrier scope requirements.',
    img: 'https://images.pexels.com/photos/5476051/pexels-photo-5476051.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&fit=crop',
  },
  {
    plate: 'Fire and smoke',
    title: 'Fire and smoke restoration scoping',
    body: 'Char depth, soot pattern, and structural assessment translated into defensible claim narrative.',
    img: 'https://images.pexels.com/photos/10252687/pexels-photo-10252687.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&fit=crop',
  },
  {
    plate: 'Estimate delivery',
    title: 'Carrier-ready estimate delivery',
    body: 'Finished Xactimate estimates, photo packets, and sketches delivered within 48 hours.',
    img: 'https://images.pexels.com/photos/7054757/pexels-photo-7054757.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&fit=crop',
  },
]

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d={dir === 'left' ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5'} strokeLinecap="square" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <rect x="4" y="3" width="2.5" height="10" />
      <rect x="9.5" y="3" width="2.5" height="10" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M5 3l8 5-8 5z" />
    </svg>
  )
}

function Caption({ s, className = '' }) {
  return (
    <div className={className}>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-brass-bright sm:text-xs">{s.plate}</p>
      <h3 className="mt-1.5 font-display text-lg leading-snug text-cream sm:text-xl md:text-2xl">{s.title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-cream-dim">{s.body}</p>
    </div>
  )
}

/**
 * Phones: photo on top, caption on a solid navy panel underneath (text over
 * a busy photo was hard to read), controls in the bottom bar, swipe to
 * change slides. md and up: caption overlays the photo on a gradient.
 */
const AUTOPLAY_MS = 5000

export default function Carousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)
  const touchX = useRef(null)

  const go = useCallback((i) => {
    setIndex((i + slides.length) % slides.length)
  }, [])

  // Auto-advance every 5 seconds. The timer restarts whenever the slide
  // changes, so a manual click or swipe always gets a full 5 seconds.
  // No pause on hover (that made it look frozen whenever the mouse rested
  // on it, and stuck on phones after a tap). Instead there is an explicit
  // pause / play button, which also covers WCAG 2.2.2 for moving content.
  // Reduced-motion users still get the rotation, as an instant swap.
  useEffect(() => {
    if (paused) return undefined
    timerRef.current = setTimeout(() => go(index + 1), AUTOPLAY_MS)
    return () => clearTimeout(timerRef.current)
  }, [index, paused, go])

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e) => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 40) go(dx < 0 ? index + 1 : index - 1)
    touchX.current = null
  }

  const arrowClass =
    'flex h-9 w-9 shrink-0 items-center justify-center border border-line bg-paper text-ink-heading transition-colors hover:border-brass hover:text-brass sm:h-10 sm:w-10'

  return (
    <div
      className="border border-line"
      role="region"
      aria-roledescription="carousel"
      aria-label="What we document"
    >
      <div
        className="relative aspect-[16/10] w-full overflow-hidden bg-ink-900 sm:aspect-[16/9] xl:aspect-[21/9]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {slides.map((s, i) => (
          <div
            key={s.plate}
            className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            aria-hidden={i !== index}
          >
            <img
              src={s.img}
              alt={s.title}
              className="h-full w-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 hidden bg-gradient-to-t from-ink-900/90 via-ink-900/20 to-transparent md:block" />
            <Caption s={s} className="absolute inset-x-0 bottom-0 hidden p-8 md:block" />
          </div>
        ))}
      </div>

      {/* Phone caption panel. All captions share one grid cell, so the panel
          keeps the height of the longest one and nothing jumps. */}
      <div className="grid bg-ink-900 px-5 py-5 md:hidden" aria-live="polite">
        {slides.map((s, i) => (
          <Caption
            key={s.plate}
            s={s}
            className={`col-start-1 row-start-1 transition-opacity duration-500 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line bg-paper-alt px-3 py-2 sm:gap-4 sm:px-4 sm:py-2.5">
        <span className="shrink-0 text-xs tabular-nums text-ink-dim">
          {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
        </span>
        <div className="hidden min-w-0 gap-1.5 min-[400px]:flex sm:gap-2">
          {slides.map((s, i) => (
            <button
              key={s.plate}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to ${s.plate}`}
              aria-current={i === index}
              className="flex h-6 items-center"
            >
              <span className={`block h-1 w-5 transition-colors sm:w-6 ${i === index ? 'bg-brass' : 'bg-line'}`} />
            </button>
          ))}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
            aria-pressed={paused}
            className={arrowClass}
          >
            {paused ? <PlayIcon /> : <PauseIcon />}
          </button>
          <button type="button" onClick={() => go(index - 1)} aria-label="Previous example" className={arrowClass}>
            <Chevron dir="left" />
          </button>
          <button type="button" onClick={() => go(index + 1)} aria-label="Next example" className={arrowClass}>
            <Chevron dir="right" />
          </button>
        </div>
      </div>
    </div>
  )
}
