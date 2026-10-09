// EmailJS settings for the browser contact form, read from Vite env vars
// (set in Vercel > Settings > Environment Variables, then redeploy).
// These values are PUBLIC by design: EmailJS expects them in the browser
// and protects the account with its allowed-domains list. The private key
// used by the server for order alerts must never get a VITE_ prefix.
// Orders no longer go through EmailJS: they are saved by /api/orders.
export const EMAILJS = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  contactTemplateId: import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
}

export function emailjsConfigured(templateId) {
  const ok = Boolean(EMAILJS.serviceId && EMAILJS.publicKey && templateId)
  if (!ok) console.error('EmailJS is not configured: set the VITE_EMAILJS_* variables (see .env.example).')
  return ok
}
