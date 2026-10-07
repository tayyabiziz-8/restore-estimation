import { Link } from 'react-router-dom'
import logoLight from '../assets/logo-light.png'
import { SITE } from '../siteConfig'

const quickLinks = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/order', label: 'Place an order' },
]

const legalLinks = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms and Conditions' },
  { to: '/refund-policy', label: 'Refund Policy' },
]

const linkClass = 'transition-colors hover:text-cream'

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-cream">
      <div className="mx-auto grid max-w-site grid-cols-2 gap-x-6 gap-y-10 px-6 py-12 md:px-10 lg:grid-cols-[1.6fr_1.2fr_1fr_1fr] lg:gap-x-12 lg:py-14 xl:px-16">
        {/* Brand */}
        <div className="col-span-2 lg:col-span-1">
          <Link to="/" aria-label="Restore Estimation home" className="inline-block">
            <img src={logoLight} alt="Restore Estimation, Xactimate estimation services" className="h-14 w-auto sm:h-16" />
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream-dim">
            Certified claim estimators writing Xactimate-ready estimates for
            restoration contractors, public adjusters and homeowners.
          </p>
          <Link
            to="/order"
            className="mt-6 inline-block bg-brass-bright px-5 py-2.5 text-sm font-medium text-ink-900 transition-colors hover:bg-cream"
          >
            Get an estimate
          </Link>
        </div>

        {/* Contact */}
        <div className="col-span-2 sm:col-span-1">
          <h2 className="text-sm font-semibold text-cream">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm text-cream-dim">
            <li>
              <a href={`mailto:${SITE.email}`} className={`${linkClass} break-all`}>{SITE.email}</a>
            </li>
            <li>
              <a href={SITE.phoneHref} className={linkClass}>{SITE.phone}</a>
            </li>
            <li>{SITE.hours}</li>
          </ul>
        </div>

        {/* Quick links */}
        <nav aria-label="Footer">
          <h2 className="text-sm font-semibold text-cream">Quick links</h2>
          <ul className="mt-3 space-y-2 text-sm text-cream-dim">
            {quickLinks.map((l) => (
              <li key={l.to}><Link to={l.to} className={linkClass}>{l.label}</Link></li>
            ))}
          </ul>
        </nav>

        {/* Legal */}
        <nav aria-label="Legal">
          <h2 className="text-sm font-semibold text-cream">Legal</h2>
          <ul className="mt-3 space-y-2 text-sm text-cream-dim">
            {legalLinks.map((l) => (
              <li key={l.to}><Link to={l.to} className={linkClass}>{l.label}</Link></li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-site flex-col gap-2 px-6 py-5 text-xs text-cream-dim md:flex-row md:items-center md:justify-between md:px-10 xl:px-16">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p className="max-w-xl md:text-right">
            Xactimate is a trademark of Verisk Analytics. {SITE.name} is an
            independent service and is not affiliated with Verisk.
          </p>
        </div>
      </div>
    </footer>
  )
}
