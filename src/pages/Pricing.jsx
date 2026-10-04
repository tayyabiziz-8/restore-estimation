import { NavLink } from 'react-router-dom'
import SectionLabel from '../components/SectionLabel'
import Reveal from '../components/Reveal'
import { TIERS, ADDONS, formatUSD } from '../data/pricing'
import usePageMeta from '../lib/usePageMeta'

// Display fields derived from the shared price list
const tiers = TIERS.map((t) => ({ ...t, price: t.amount ? formatUSD(t.amount) : 'Quoted', unit: 'per claim' }))
const addOns = ADDONS


export default function Pricing() {
  usePageMeta({
    title: 'Pricing',
    description: 'Simple per-claim pricing for Xactimate estimates: Minor Loss $85, Roof Damage $150, Total Loss $220. Large Loss quoted. No subscriptions.',
    path: '/pricing',
  })
  return (
    <div className="mx-auto max-w-site px-6 py-10 md:px-10 xl:px-16 md:py-14">
      <SectionLabel>Rate schedule</SectionLabel>
      <h1 className="max-w-2xl font-display text-3xl text-ink-heading md:text-4xl">
        Straightforward pricing, billed per claim.
      </h1>
      <p className="mt-4 max-w-xl text-ink-body">
        No subscriptions or minimums. Pick the tier that matches the loss, add
        rush or on-site service if needed, and pay securely by card when you
        order. Large Loss jobs are quoted first.
      </p>

      <Reveal variant="scale" className="mt-8 grid grid-cols-1 gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t) => (
          <div key={t.code} className={`flex flex-col bg-paper p-6 lg:p-8 ${t.highlight ? 'ring-1 ring-inset ring-brass' : ''}`}>
            <div className="flex items-center justify-between text-sm text-ink-dim">
              <span className="font-medium text-brass">{t.code}</span>
              {t.highlight && <span className="text-xs font-medium uppercase tracking-wide text-brass">Most ordered</span>}
            </div>
            <h2 className="mt-3 font-display text-xl text-ink-heading">{t.name}</h2>
            <p className="mt-3 font-display text-3xl text-ink-heading">
              {t.price}
              <span className="ml-1 text-sm font-normal text-ink-dim">{t.unit}</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-body">{t.body}</p>
            <ul className="mb-6 mt-4 space-y-1.5 text-sm text-ink-body">
              {t.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="h-px w-3 shrink-0 bg-brass/70" />
                  {f}
                </li>
              ))}
            </ul>
            <NavLink
              to={`/order?tier=${t.id}`}
              className="mt-auto bg-brass py-3 text-center text-sm font-medium text-paper transition-colors hover:bg-ink-heading lg:py-2.5"
            >
              {t.amount ? 'Order this tier' : 'Request a quote'}
            </NavLink>
          </div>
        ))}
      </Reveal>

      <Reveal className="mt-10">
        <SectionLabel>Add-ons</SectionLabel>
        <h2 className="font-display text-2xl text-ink-heading">Optional line items</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[480px] border-t border-line text-left">
            <thead>
              <tr className="text-xs font-medium uppercase tracking-wide text-ink-dim">
                <th className="py-3 pr-4 font-medium">Code</th>
                <th className="py-3 pr-4 font-medium">Item</th>
                <th className="py-3 pr-4 text-right font-medium">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {addOns.map((a) => (
                <tr key={a.code} className="text-sm">
                  <td className="py-3 pr-4 font-medium text-brass">{a.code}</td>
                  <td className="py-3 pr-4 text-ink-heading">{a.label}</td>
                  <td className="py-3 pr-4 text-right text-ink-dim">{a.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </div>
  )
}
