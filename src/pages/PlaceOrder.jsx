import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import emailjs from '@emailjs/browser'
import SectionLabel from '../components/SectionLabel'
import ConsentCheckbox, { PolicyLink } from '../components/ConsentCheckbox'
import { SITE } from '../siteConfig'
import {
  TIERS,
  MAX_EXTRA_ROOMS,
  buildLineItems,
  canAddRooms,
  formatUSD,
  getTier,
  isPayableTier,
  totalOf,
} from '../data/pricing'
import { newOrderRef, startCheckout, savePendingCheckout } from '../lib/checkout'
import usePageMeta from '../lib/usePageMeta'

// Reuses the same EmailJS project as the contact form, set these once.
// See README.md. Note: sending file attachments (scope notes, images,
// measurements) depends on your EmailJS plan's attachment limits, check
// their pricing page if large files fail to send.
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'
const EMAILJS_ORDER_TEMPLATE_ID = 'YOUR_ORDER_TEMPLATE_ID'
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'

const lossTypes = ['Water damage', 'Fire & smoke', 'Roof damage', 'Mold remediation', 'Reconstruction takeoff', 'Estimate review / audit', 'Other']

const tierOptions = [
  ...TIERS.map((t) => ({ value: t.id, label: t.amount ? `${t.name} (${formatUSD(t.amount)})` : `${t.name} (quoted)` })),
  { value: 'unsure', label: 'Not sure yet, quote me' },
]
const urgencyOptions = [
  { value: 'standard', label: 'Standard (48 hrs)' },
  { value: 'rush', label: 'Rush, same day (+$60)' },
]

const inputClass =
  'mt-2 w-full border border-line bg-paper px-3 py-2.5 text-ink-heading outline-none transition-colors focus:border-brass'

const fileInputClass =
  'mt-2 w-full border border-line bg-paper px-3 py-2.5 text-sm text-ink-body outline-none transition-colors focus:border-brass ' +
  'file:mr-4 file:cursor-pointer file:border-0 file:bg-brass file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-paper hover:file:bg-ink-heading'

const legendClass = 'mb-2 text-xs font-medium uppercase tracking-[0.14em] text-brass'

// Data minimisation: only what is needed to confirm the order, write the
// estimate, and deliver it. Phone and company were removed on purpose.
// Card details are never collected here: Stripe Checkout handles them.
const validationSchema = Yup.object({
  name: Yup.string().trim().required('Please enter your name'),
  email: Yup.string().trim().email('Enter a valid email address').required('Please enter your email'),
  address: Yup.string().trim().required('Please enter the property address'),
  lossType: Yup.string().required(),
  tier: Yup.string().required(),
  urgency: Yup.string().required(),
  onsite: Yup.boolean(),
  extraRooms: Yup.number()
    .typeError('Enter a number')
    .integer('Whole rooms only')
    .min(0, 'Cannot be negative')
    .max(MAX_EXTRA_ROOMS, `For more than ${MAX_EXTRA_ROOMS} extra rooms, choose Large Loss`),
  scopeNotesText: Yup.string(),
  details: Yup.string(),
  filesNote: Yup.string(),
  consent: Yup.boolean().oneOf([true], 'Please accept the terms to place your order'),
  website: Yup.string(), // honeypot, must stay empty
})

const checklist = [
  { title: 'Photos', body: 'Upload images, or share a link (Encircle, Matterport, shared drive). One of the two is required.' },
  { title: 'Scope notes', body: 'Type them in, upload a file, or snap a photo of handwritten notes.' },
  { title: 'Measurements', body: 'A sketch export, laser scan, or room list if you have one.' },
]

export default function PlaceOrder() {
  usePageMeta({
    title: 'Place an order',
    description: 'Send your scope notes, photos and measurements and get a carrier-ready Xactimate estimate. Pay securely online with Stripe.',
    path: '/order',
  })
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('idle') // idle | sending | redirecting | quoted | error | payError
  const [attachmentError, setAttachmentError] = useState('')
  const [payError, setPayError] = useState('')
  const [pendingPayload, setPendingPayload] = useState(null)
  const formRef = useRef(null)
  const consentAtRef = useRef(null)
  const orderRefInput = useRef(null)

  const startTier = tierOptions.some((o) => o.value === searchParams.get('tier')) ? searchParams.get('tier') : 'total'

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      address: '',
      lossType: lossTypes[0],
      tier: startTier,
      urgency: 'standard',
      onsite: false,
      extraRooms: 0,
      scopeNotesText: '',
      details: '',
      filesNote: '',
      consent: false,
      website: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      if (values.website) return // honeypot

      // At least one of Images or a Link must be provided before ordering.
      const imagesInput = formRef.current?.querySelector('input[name="images"]')
      const hasImages = imagesInput && imagesInput.files && imagesInput.files.length > 0
      const hasLink = values.filesNote.trim().length > 0
      if (!hasImages && !hasLink) {
        setAttachmentError('Please attach at least one image, or add a link to your photos, before submitting.')
        document.getElementById('images')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
      setAttachmentError('')

      // One reference ties the order email, the Stripe payment and the
      // "payment received" email together.
      // Written straight into the hidden inputs because sendForm reads the DOM.
      const orderRef = newOrderRef()
      if (orderRefInput.current) orderRefInput.current.value = orderRef
      if (consentAtRef.current) consentAtRef.current.value = new Date().toISOString()

      setStatus('sending')
      try {
        // 1. Send the order and files first. Files cannot survive the trip
        //    to Stripe and back, so they go now, marked as awaiting payment.
        //    The office only starts work after the "payment received" email.
        await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_ORDER_TEMPLATE_ID, formRef.current, {
          publicKey: EMAILJS_PUBLIC_KEY,
        })
      } catch (err) {
        console.error(err)
        setStatus('error')
        return
      }

      // Quoted tiers stop here: we reply with a quote and a payment link.
      if (!isPayableTier(values.tier)) {
        setStatus('quoted')
        formRef.current?.reset()
        return
      }

      // 2. Hand over to Stripe Checkout.
      const payload = {
        orderRef,
        tierId: values.tier,
        rush: values.urgency === 'rush',
        onsite: values.onsite,
        extraRooms: canAddRooms(values.tier) ? Number(values.extraRooms) || 0 : 0,
        name: values.name,
        email: values.email,
        address: values.address,
      }
      await pay(payload)
    },
  })

  async function pay(payload) {
    setPendingPayload(payload)
    setPayError('')
    setStatus('redirecting')
    try {
      savePendingCheckout(payload) // lets the cancelled page offer "try again"
      await startCheckout(payload) // navigates away on success
    } catch (err) {
      setPayError(err.message)
      setStatus('payError')
    }
  }

  const values = formik.values
  const payable = isPayableTier(values.tier)
  const items = useMemo(
    () =>
      buildLineItems({
        tierId: values.tier,
        rush: values.urgency === 'rush',
        onsite: values.onsite,
        extraRooms: canAddRooms(values.tier) ? Math.max(0, Math.floor(Number(values.extraRooms) || 0)) : 0,
      }),
    [values.tier, values.urgency, values.onsite, values.extraRooms],
  )
  const total = totalOf(items)
  const tier = getTier(values.tier)

  if (status === 'quoted') {
    return (
      <Notice label="Quote request received" title="We'll send your quote.">
        An estimator will review the file and email you a quote and a secure
        payment link, usually within one business day. Work starts once the
        quote is accepted and paid.
      </Notice>
    )
  }

  if (status === 'payError') {
    return (
      <Notice label={`Order ${pendingPayload?.orderRef ?? ''}`} title="Your files reached us, but payment did not start.">
        <span className="block">{payError}</span>
        <span className="mt-6 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => pay(pendingPayload)}
            className="bg-brass px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-heading"
          >
            Try payment again
          </button>
          <a href={`mailto:${SITE.email}?subject=Order ${pendingPayload?.orderRef ?? ''}`} className="border border-line px-6 py-3 text-sm font-medium text-ink-body hover:border-ink-heading">
            Email us instead
          </a>
        </span>
      </Notice>
    )
  }

  const busy = status === 'sending' || status === 'redirecting'
  const submitLabel =
    status === 'sending' ? 'Sending your files…'
      : status === 'redirecting' ? 'Opening secure checkout…'
        : payable ? `Continue to payment, ${formatUSD(total)}` : 'Request a quote'

  return (
    <div className="mx-auto max-w-site px-6 py-10 md:px-10 md:py-14 xl:px-16">
      <SectionLabel>Work order</SectionLabel>
      <h1 className="font-display text-3xl text-ink-heading md:text-4xl">Place an order</h1>
      <p className="mt-4 max-w-2xl text-ink-body">
        Tell us about the property, send your scope notes and photos, then pay
        securely with Stripe. We only ask for what we need to write the estimate.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-16">
        {/* Side panel: order summary and checklist. Beside the form on large screens. */}
        <aside className="space-y-6 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <OrderSummary tier={tier} items={items} total={total} payable={payable} className="hidden lg:block" />

          <div className="border border-line bg-paper-alt p-5 sm:p-6">
            <h2 className="font-display text-lg text-ink-heading">Have these ready</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3 lg:grid-cols-1">
              {checklist.map((c) => (
                <div key={c.title} className="border-l-2 border-brass pl-3">
                  <dt className="font-medium text-ink-heading">{c.title}</dt>
                  <dd className="mt-1 leading-relaxed text-ink-dim">{c.body}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-ink-dim">
              <span className="font-medium text-ink-heading">Leave out</span> homeowner
              ID numbers, policy numbers, and card details. Payment happens on
              Stripe's secure page, and we never see your card number.
            </p>
          </div>
        </aside>

        <form ref={formRef} onSubmit={formik.handleSubmit} className="min-w-0 space-y-10 lg:order-1" noValidate>
          <input
            type="text"
            name="website"
            value={values.website}
            onChange={formik.handleChange}
            className="hidden"
            tabIndex="-1"
            autoComplete="off"
            aria-hidden="true"
          />
          {/* Sent with the order email so the office can match it to the payment */}
          <input ref={consentAtRef} type="hidden" name="consent_at" defaultValue="" />
          <input ref={orderRefInput} type="hidden" name="order_ref" defaultValue="" />
          <input type="hidden" name="tier_label" value={tier ? tier.name : 'Not sure yet'} readOnly />
          <input type="hidden" name="order_total" value={payable ? formatUSD(total) : 'Quote requested'} readOnly />
          <input type="hidden" name="payment_status" value={payable ? 'Awaiting payment, do not start until the payment email arrives' : 'Quote requested'} readOnly />

          <fieldset className="grid gap-6 sm:grid-cols-2">
            <legend className={`${legendClass} sm:col-span-2`}>1. Contact</legend>
            <Field label="Full name" name="name" formik={formik} required autoComplete="name" />
            <Field label="Email" name="email" type="email" formik={formik} required autoComplete="email" hint="Your receipt and estimate go here." />
          </fieldset>

          <fieldset className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <legend className={`${legendClass} sm:col-span-2 xl:col-span-3`}>2. Property and order</legend>
            <Field
              label="Property address"
              name="address"
              formik={formik}
              required
              className="sm:col-span-2 xl:col-span-3"
              hint="Printed on the estimate and used to apply your area's price list."
            />
            <SelectField label="Loss type" name="lossType" formik={formik} options={lossTypes} />
            <SelectField
              label="Tier"
              name="tier"
              formik={formik}
              options={tierOptions}
              hint={payable ? null : 'Quoted tiers are reviewed first. No payment today.'}
            />
            <SelectField label="Turnaround" name="urgency" formik={formik} options={urgencyOptions} className="sm:col-span-2 xl:col-span-1" />

            {payable && (
              <div className="grid gap-6 sm:col-span-2 sm:grid-cols-2 xl:col-span-3">
                <label htmlFor="onsite" className="flex cursor-pointer items-start gap-3 border border-line bg-paper px-4 py-3 text-sm text-ink-body">
                  <input
                    id="onsite"
                    name="onsite"
                    type="checkbox"
                    value="Yes"
                    checked={values.onsite}
                    onChange={(e) => formik.setFieldValue('onsite', e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#8f6035]"
                  />
                  <span>
                    <span className="block font-medium text-ink-heading">On-site visit (+$150)</span>
                    An estimator measures in person, within 50 miles.
                  </span>
                </label>
                {canAddRooms(values.tier) && (
                  <Field
                    label={`Extra rooms beyond ${tier.includedRooms} included ($25 each)`}
                    name="extraRooms"
                    type="number"
                    formik={formik}
                    inputMode="numeric"
                    min={0}
                    max={MAX_EXTRA_ROOMS}
                  />
                )}
              </div>
            )}
          </fieldset>
          <fieldset className="grid gap-6 sm:grid-cols-2">
            <legend className={`${legendClass} sm:col-span-2`}>3. Scope notes, images and measurements</legend>

            <div className="sm:col-span-2">
              <label htmlFor="scopeNotesText" className="block text-sm font-medium text-ink-heading">
                Scope notes
              </label>
              <textarea
                id="scopeNotesText"
                name="scopeNotesText"
                rows={5}
                value={formik.values.scopeNotesText}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Type your scope notes here, or attach a file or photo of them below."
                className={`${inputClass} resize-y`}
              />
            </div>

            <FileField
              label="Scope notes file or photo (optional)"
              name="scope_notes_file"
              accept=".pdf,.doc,.docx,.txt,image/*"
              hint="PDF, Word doc, text file, or a photo of your notes."
            />
            <FileField
              label="Measurements file (optional)"
              name="measurements_file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*"
              hint="Room measurements, sketch export, or laser-scan file."
            />

            <FileField
              label="Images"
              name="images"
              accept="image/*"
              multiple
              hint="Photos of the affected areas. You can select several."
            />
            <Field
              label="Or a link to your photos"
              name="filesNote"
              formik={formik}
              type="url"
              placeholder="Encircle, Matterport, or shared drive link"
              hint="Images or a link: one of the two is required."
            />
            {attachmentError && (
              <p className="text-sm text-red-700 sm:col-span-2" role="alert">{attachmentError}</p>
            )}
          </fieldset>

          <fieldset>
            <legend className={legendClass}>4. Notes for the estimator</legend>
            <label htmlFor="details" className="sr-only">Notes for the estimator</label>
            <textarea
              id="details"
              name="details"
              rows={4}
              value={formik.values.details}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Anything else the estimator should know before starting (optional)."
              className={`${inputClass} resize-y`}
            />
          </fieldset>

          <fieldset className="border-t border-line pt-8">
            <legend className="sr-only">5. Agreement and payment</legend>

            {/* Total near the button: the only summary on phones and tablets */}
            <OrderSummary tier={tier} items={items} total={total} payable={payable} className="mb-6 lg:hidden" />

            <ConsentCheckbox formik={formik}>
              I agree to the <PolicyLink to="/terms">Terms and Conditions</PolicyLink> and{' '}
              <PolicyLink to="/refund-policy">Refund Policy</PolicyLink>, and I have read the{' '}
              <PolicyLink to="/privacy">Privacy Policy</PolicyLink>. I have permission to share
              the property details and photos in this order.
            </ConsentCheckbox>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-brass px-8 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-heading disabled:opacity-60 sm:w-auto"
              >
                {submitLabel}
              </button>
              <p className="flex items-center gap-2 text-xs text-ink-dim">
                <LockIcon />
                {payable ? 'Secure payment by Stripe. Card, Apple Pay or Google Pay.' : 'No payment until you accept the quote.'}
              </p>
            </div>

            {status === 'error' && (
              <p className="mt-4 text-sm text-red-700" role="alert">
                The order did not send and you have not been charged. Please try again, or email the details to {SITE.email}.
              </p>
            )}
          </fieldset>
        </form>
      </div>
    </div>
  )
}

function OrderSummary({ tier, items, total, payable, className = '' }) {
  return (
    <div className={`border border-ink-heading/80 bg-paper p-5 sm:p-6 ${className}`}>
      <h2 className="font-display text-lg text-ink-heading">Order summary</h2>
      {payable ? (
        <>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.name} className="flex justify-between gap-4">
                <span className="text-ink-body">
                  {i.name}
                  {i.quantity > 1 && <span className="text-ink-dim"> × {i.quantity}</span>}
                </span>
                <span className="tabular-nums text-ink-heading">{formatUSD(i.amount * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-sm font-medium text-ink-heading">Total due today</span>
            <span className="font-display text-2xl tabular-nums text-ink-heading">{formatUSD(total)}</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-dim">
            Turnaround starts once payment clears. Cancel before work starts
            for a full refund.
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-ink-body">
          {tier ? `${tier.name} jobs are` : 'This order is'} quoted after a
          quick file review. You will get the quote and a secure payment link
          by email. Nothing is charged today.
        </p>
      )}
    </div>
  )
}

function Notice({ label, title, children }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center md:px-10">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-brass">{label}</p>
      <h1 className="mt-4 font-display text-3xl text-ink-heading">{title}</h1>
      <div className="mt-4 text-ink-body">{children}</div>
      <Link to="/" className="mt-8 inline-block text-sm text-brass underline underline-offset-4">Back to home</Link>
    </div>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  )
}

function Field({ label, name, formik, type = 'text', required, className = '', hint, placeholder, autoComplete, inputMode, min, max }) {
  const error = formik.touched[name] && formik.errors[name]
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-ink-heading">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        min={min}
        max={max}
        value={formik.values[name]}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        aria-invalid={Boolean(error)}
        className={inputClass}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-ink-dim">{hint}</p>}
      {error && <p className="mt-1.5 text-sm text-red-700">{error}</p>}
    </div>
  )
}

function SelectField({ label, name, formik, options, className = '', hint }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-ink-heading">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={formik.values[name]}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        className={inputClass}
      >
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )
        })}
      </select>
      {hint && <p className="mt-1.5 text-xs text-ink-dim">{hint}</p>}
    </div>
  )
}

function FileField({ label, name, accept, multiple, hint, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-ink-heading">
        {label}
      </label>
      <input id={name} name={name} type="file" accept={accept} multiple={multiple} className={fileInputClass} />
      {hint && <p className="mt-1.5 text-xs text-ink-dim">{hint}</p>}
    </div>
  )
}
