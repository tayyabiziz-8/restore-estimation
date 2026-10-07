import { useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import emailjs from '@emailjs/browser'
import ConsentCheckbox, { PolicyLink } from './ConsentCheckbox'
import { SITE } from '../siteConfig'
import { EMAILJS, emailjsConfigured } from '../lib/emailjs'
// EmailJS IDs come from VITE_EMAILJS_* env vars, see docs/emailjs-setup.md.

const inputClass =
  'mt-2 w-full border border-line bg-paper px-3 py-2.5 text-ink-heading outline-none transition-colors focus:border-brass'

const validationSchema = Yup.object({
  name: Yup.string().trim().required('Please enter your name'),
  email: Yup.string().trim().email('Enter a valid email address').required('Please enter your email'),
  message: Yup.string().trim().min(10, 'Message should be at least 10 characters').required('Please enter a message'),
  consent: Yup.boolean().oneOf([true], 'Please agree so we can reply to you'),
  company: Yup.string(), // honeypot, must stay empty
})

export default function ContactForm() {
  const [status, setStatus] = useState('idle') // idle | sending | sent | error

  const formik = useFormik({
    initialValues: { name: '', email: '', message: '', consent: false, company: '' },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      if (values.company) return // honeypot tripped, silently drop

      if (!emailjsConfigured(EMAILJS.contactTemplateId)) {
        setStatus('error')
        return
      }
      setStatus('sending')
      try {
        await emailjs.send(
          EMAILJS.serviceId,
          EMAILJS.contactTemplateId,
          {
            from_name: values.name,
            from_email: values.email,
            message: values.message,
            consent: 'Yes',
            consent_at: new Date().toISOString(),
          },
          { publicKey: EMAILJS.publicKey }
        )
        setStatus('sent')
        resetForm()
      } catch (err) {
        console.error(err)
        setStatus('error')
      }
    },
  })

  if (status === 'sent') {
    return (
      <div className="border border-line bg-paper-alt p-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brass">Message received</p>
        <p className="mt-3 font-display text-xl text-ink-heading">Thanks. We'll reply within one business day.</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm text-ink-dim underline underline-offset-4 hover:text-brass"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-5" noValidate>
      <input
        type="text"
        name="company"
        value={formik.values.company}
        onChange={formik.handleChange}
        className="hidden"
        tabIndex="-1"
        autoComplete="off"
        aria-hidden="true"
      />

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink-heading">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={inputClass}
        />
        {formik.touched.name && formik.errors.name && (
          <p className="mt-1.5 text-sm text-red-700">{formik.errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink-heading">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={inputClass}
        />
        {formik.touched.email && formik.errors.email && (
          <p className="mt-1.5 text-sm text-red-700">{formik.errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-ink-heading">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          value={formik.values.message}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`${inputClass} resize-none`}
        />
        {formik.touched.message && formik.errors.message && (
          <p className="mt-1.5 text-sm text-red-700">{formik.errors.message}</p>
        )}
      </div>

      <ConsentCheckbox formik={formik}>
        I agree that {SITE.name} can use these details to reply to me, as
        described in the <PolicyLink to="/privacy">Privacy Policy</PolicyLink>.
      </ConsentCheckbox>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="bg-brass px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-heading disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>

      {status === 'error' && (
        <p className="text-sm text-red-700">
          Something went wrong. Please email us directly at {SITE.email}.
        </p>
      )}
    </form>
  )
}
