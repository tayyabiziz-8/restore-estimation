import { useEffect, useRef, useState } from 'react'

/**
 * Counts from 0 up to `to` the first time it scrolls into view, easing out
 * so it slows down as it lands. The final value is reserved invisibly
 * underneath, so the width never jumps while the digits change.
 * Reduced-motion users see the final number straight away.
 */
export default function CountUp({ to, duration = 1800, prefix = '', suffix = '', className = '' }) {
  const ref = useRef(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setValue(to)
      return undefined
    }

    let frame
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const tick = (now) => {
          const t = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
          setValue(Math.round(eased * to))
          if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.6 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [to, duration])

  const fmt = (n) => `${prefix}${n.toLocaleString('en-US')}${suffix}`

  return (
    <span ref={ref} className={`relative inline-block tabular-nums ${className}`}>
      <span className="invisible" aria-hidden="true">{fmt(to)}</span>
      <span className="absolute inset-0" aria-hidden="true">{fmt(value)}</span>
      <span className="sr-only">{fmt(to)}</span>
    </span>
  )
}
