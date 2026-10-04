import { NavLink } from 'react-router-dom'
import SectionLabel from '../components/SectionLabel'
import Reveal from '../components/Reveal'
import usePageMeta from '../lib/usePageMeta'

const services = [
  {
    code: 'S-01',
    title: 'Water damage estimating',
    body: 'We estimate the cost to fix water damage from burst pipes, appliance leaks, and storms. We check moisture levels, list the damaged materials, and record the drying equipment used, written the way your insurance company expects.',
    deliverables: ['Xactimate estimate', 'Moisture log', 'Photo packet'],
  },
  {
    code: 'S-02',
    title: 'Fire & smoke restoration estimating',
    body: 'We estimate the cost to repair fire and smoke damage. We look at burn depth, soot, and structural damage, then write a clear, room-by-room estimate you can hand straight to the carrier.',
    deliverables: ['Xactimate estimate', 'Room-by-room notes', 'Photo packet'],
  },
  {
    code: 'S-03',
    title: 'Mold remediation estimating',
    body: 'We estimate the cost to remove mold safely. This covers containment, air cleaning, and removing damaged materials, based on current safety guidelines and local prices.',
    deliverables: ['Xactimate estimate', 'Containment sketch'],
  },
  {
    code: 'S-04',
    title: 'Reconstruction takeoffs',
    body: 'We measure what it takes to rebuild: framing, drywall, flooring, and finishes, using your photos, sketches, or scans.',
    deliverables: ['Line-item takeoff', 'Floor plan sketch'],
  },
  {
    code: 'S-05',
    title: 'Estimate review & supplements',
    body: "We review an estimate you already have and check it against your photos and current prices. If you find more damage after the estimate was approved, we can also write a supplement for just the new items.",
    deliverables: ['Markup report', 'Supplement / revised estimate'],
  },
  {
    code: 'S-06',
    title: 'Rush estimating',
    body: 'Need it fast? We can turn your estimate around the same day, if we have room in our schedule. Just ask when you place your order.',
    deliverables: ['Xactimate estimate', 'Priority queue'],
  },
]

export default function Services() {
  usePageMeta({
    title: 'Services',
    description: 'Xactimate estimates, sketches, takeoffs, estimate reviews and supplements for water, fire, mold, roof and large-loss property claims.',
    path: '/services',
  })
  return (
    <div className="mx-auto max-w-site px-6 py-10 md:px-10 xl:px-16 md:py-14">
      <SectionLabel>Schedule of services</SectionLabel>
      <h1 className="max-w-2xl font-display text-3xl text-ink-heading md:text-4xl">
        Six ways to get a claim measured, scoped, and written.
      </h1>
      <p className="mt-4 max-w-xl text-ink-body">
        A certified claim estimator writes every estimate, and we always
        check it against the latest price list for your area before we send
        it to you.
      </p>

      <div className="mt-8 divide-y divide-line border-t border-line">
        {services.map((s) => (
          <Reveal key={s.code} className="grid gap-3 py-6 md:grid-cols-[80px_1fr_220px] md:gap-8 xl:grid-cols-[120px_1fr_320px] xl:gap-12">
            <span className="text-sm font-medium text-brass">{s.code}</span>
            <div>
              <h2 className="font-display text-xl text-ink-heading">{s.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-dim">{s.body}</p>
            </div>
            <div className="text-sm text-ink-dim">
              <p className="mb-1.5 font-medium text-ink-heading">You'll get</p>
              <ul className="space-y-1">
                {s.deliverables.map((d) => (
                  <li key={d} className="flex items-center gap-2">
                    <span className="h-px w-3 bg-brass/70" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-line pt-8">
        <p className="max-w-md text-ink-dim">
          Not sure which service fits your claim? Check our pricing, or send
          us the file and we'll scope it for you.
        </p>
        <div className="flex gap-4">
          <NavLink to="/pricing" className="border border-line px-6 py-3 text-sm font-medium text-ink-body transition-colors hover:border-ink-heading hover:text-ink-heading">
            View pricing
          </NavLink>
          <NavLink to="/order" className="bg-brass px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-heading">
            Place an order
          </NavLink>
        </div>
      </div>
    </div>
  )
}
