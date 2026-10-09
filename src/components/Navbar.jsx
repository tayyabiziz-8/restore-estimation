import { Link, NavLink, useLocation } from 'react-router-dom'
import logoMark from '../assets/logo-mark.png'

const links = [
  { to: '/', label: 'Home', end: true, desktopOnly: true }, // the logo already links home on phones
  { to: '/services', label: 'Services' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/order', label: 'Place Order', mobileLabel: 'Order' },
]

// Jumps to the contact form at the bottom of the home page. When already on
// the home page the URL may not change (same #contact), so scroll directly.
function useContactClick() {
  const { pathname } = useLocation()
  return () => {
    if (pathname === '/') {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

export default function Navbar() {
  const onContactClick = useContactClick()
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white shadow-[0_1px_3px_rgba(26,47,66,0.06)]">
      <div className="mx-auto flex max-w-site items-center justify-between gap-3 px-4 py-2.5 sm:px-6 md:px-10 xl:px-16">
        <NavLink to="/" className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2" aria-label="Restore Estimation home">
          <img src={logoMark} alt="" className="h-8 w-auto shrink-0 min-[360px]:h-9 sm:h-11 lg:h-12" />
          {/* Phones and small tablets: stacked wordmark echoing the logo
              (RESTORE over a smaller, spaced ESTIMATION). */}
          <span className="flex flex-col leading-none md:hidden" aria-hidden="true">
            <span className="font-logo text-[11px] font-bold tracking-tight text-ink-heading min-[360px]:text-[13px] sm:text-base">
              RESTORE
            </span>
            <span className="font-logo mt-[3px] text-[7.5px] font-medium tracking-[0.16em] text-ink-dim min-[360px]:text-[8.5px] sm:text-[10.5px]">
              ESTIMATION
            </span>
          </span>
          {/* Hidden between md and lg so the full desktop bar fits tablets */}
          <span className="font-logo hidden truncate text-lg font-bold tracking-tight text-ink-heading lg:inline">
            Restore Estimation
          </span>
        </NavLink>

        <nav aria-label="Primary" className="hidden items-center gap-5 text-[15px] text-ink-body md:flex lg:gap-7">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `relative py-1 transition-colors hover:text-ink-heading ${isActive ? 'font-medium text-brass' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-px bg-brass transition-all ${isActive ? 'w-full' : 'w-0'}`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 md:flex lg:gap-3">
          <Link
            to="/#contact"
            onClick={onContactClick}
            className="border border-line px-4 py-2.5 text-sm font-medium text-ink-body lg:px-5 transition-colors hover:border-ink-heading hover:text-ink-heading"
          >
            Contact
          </Link>
          <NavLink
            to="/order"
            className="bg-brass px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ink-heading lg:px-5"
          >
            Get an Estimate
          </NavLink>
        </div>

        {/* Mobile nav */}
        <nav aria-label="Primary mobile" className="flex shrink-0 items-center gap-2 text-[11.5px] text-ink-body min-[360px]:gap-2.5 min-[360px]:text-[12.5px] min-[400px]:gap-3.5 min-[400px]:text-[13.5px] sm:gap-4 sm:text-sm md:hidden">
          {links.filter((l) => !l.desktopOnly).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => (isActive ? 'font-medium text-brass' : '')}
            >
              {l.mobileLabel || l.label}
            </NavLink>
          ))}
          <Link to="/#contact" onClick={onContactClick}>
            Contact
          </Link>
        </nav>
      </div>
    </header>
  )
}
