// EmailJS settings for the browser forms, read from Vite env vars so they
// can be set in Vercel (Settings > Environment Variables) without editing
// code. These four values are PUBLIC by design: EmailJS expects them in the
// browser and protects the account with the allowed-domains list. The
// private key is different and must never get a VITE_ prefix.
export const EMAILJS = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  contactTemplateId: import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID,
  orderTemplateId: import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  // Total attachment size allowed per email by the EmailJS plan:
  // Personal 500 KB, Professional 2 MB, Business 30 MB.
  attachmentLimitKb: Number(import.meta.env.VITE_EMAILJS_ATTACHMENT_LIMIT_KB || 2048),
}

export function emailjsConfigured(templateId) {
  const ok = Boolean(EMAILJS.serviceId && EMAILJS.publicKey && templateId)
  if (!ok) console.error('EmailJS is not configured: set the VITE_EMAILJS_* variables (see .env.example).')
  return ok
}

export function formatSize(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
}
