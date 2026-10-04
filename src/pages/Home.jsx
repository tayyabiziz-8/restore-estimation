import { NavLink } from 'react-router-dom'
import Carousel from '../components/Carousel'
import ContactForm from '../components/ContactForm'
import SectionLabel from '../components/SectionLabel'
import BlueprintHero from '../components/BlueprintHero'
import Reveal from '../components/Reveal'
import { SITE } from '../siteConfig'
import usePageMeta from '../lib/usePageMeta'

const steps = [
  {
    n: '01',
    title: 'Submit the details',
    body: 'Send photos, scope notes, or a completed Encircle/Matterport export through Place Order.',
  },
  {
    n: '02',
    title: 'We measure and scope',
    body: 'A certified estimator maps affected areas against carrier requirements and current price lists.',
  },
  {
    n: '03',
    title: 'Estimate delivered',
    body: 'A carrier-ready Xactimate estimate, sketch, and photo packet lands in your inbox within 48 hours.',
  },
]

const stats = [
  { value: '24–48 hours', label: 'Average turnaround time' },
  { value: '3,100+', label: 'Estimates written' },
]

export default function Home() {
  usePageMeta({
    title: null,
    description: 'Xactimate-ready estimates for water, fire, mold, roof and large-loss claims. Written by certified estimators for restoration contractors, delivered in 24 to 48 hours.',
    path: '/',
  })
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="blueprint-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="mx-auto grid max-w-site gap-8 px-6 py-12 md:grid-cols-2 md:items-center md:px-10 xl:px-16 md:py-16">
          <div className="relative z-10">
            <Reveal variant="fade">
              <SectionLabel>Est. for restoration &amp; property claims</SectionLabel>
            </Reveal>
            <Reveal as="h1" delay={80} className="font-display text-4xl leading-[1.15] text-ink-heading md:text-5xl xl:text-6xl">
              Estimates measured to the line, not the guess.
            </Reveal>
            <Reveal as="p" delay={180} className="mt-5 max-w-md text-ink-body">
              Restore Estimation writes carrier-ready Xactimate estimates for
              restoration contractors, scoped by certified estimators and
              delivered in days, not weeks.
            </Reveal>
            <Reveal delay={280} className="mt-8 flex flex-wrap gap-4">
              <NavLink
                to="/order"
                className="bg-brass px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-heading"
              >
                Get an estimate
              </NavLink>
              <NavLink
                to="/services"
                className="border border-line px-6 py-3 text-sm font-medium text-ink-body transition-colors hover:border-ink-heading hover:text-ink-heading"
              >
                View services
              </NavLink>
            </Reveal>
          </div>
          <div className="relative z-10">
            <BlueprintHero />
          </div>
        </div>
      </section>

      {/* Carousel */}
      <section className="mx-auto max-w-site px-6 py-12 md:px-10 xl:px-16">
        <Reveal variant="fade">
          <SectionLabel>What we document</SectionLabel>
        </Reveal>
        <Reveal variant="scale" delay={100}>
          <Carousel />
        </Reveal>
      </section>

      {/* How it works */}
      <section className="border-t border-line bg-paper-alt">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 xl:px-16">
          <Reveal>
            <SectionLabel>Process</SectionLabel>
            <h2 className="font-display text-2xl text-ink-heading md:text-3xl">How an order moves through the shop</h2>
          </Reveal>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 120} className="border-t-2 border-brass pt-4">
                <span className="text-sm font-medium text-brass">{s.n}</span>
                <h3 className="mt-2 font-display text-lg text-ink-heading">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-line bg-ink-900">
        <div className="mx-auto grid max-w-site gap-8 px-6 py-10 sm:grid-cols-2 md:px-10 xl:px-16 sm:[&>*+*]:border-l sm:[&>*+*]:border-cream/10 sm:[&>*+*]:pl-8">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 120} className="text-center sm:text-left">
              <p className="font-display text-3xl text-brass-bright">{s.value}</p>
              <p className="mt-1 text-sm text-cream-dim">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto grid max-w-site gap-10 px-6 py-12 md:grid-cols-2 md:px-10 xl:px-16">
          <Reveal>
            <SectionLabel>Contact</SectionLabel>
            <h2 className="font-display text-2xl text-ink-heading md:text-3xl">Send us the file</h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-dim">
              Questions about a claim, timeline, or coverage area? Write to us
              directly and an estimator will respond within one business day.
            </p>
            <dl className="mt-6 space-y-2 text-sm text-ink-body">
              <div className="flex gap-2">
                <dt className="font-medium text-ink-heading">Email</dt>
                <dd>
                  <a href={`mailto:${SITE.email}`} className="break-all transition-colors hover:text-brass">{SITE.email}</a>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-ink-heading">Phone</dt>
                <dd>
                  <a href={SITE.phoneHref} className="transition-colors hover:text-brass">{SITE.phone}</a>
                </dd>
              </div>
            </dl>
          </Reveal>
          <Reveal delay={150}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </div>
  )
}
