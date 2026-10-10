// Short "something needs attention" emails to the office, sent from the
// server through EmailJS's REST API. Works with the prebuilt "Contact Us"
// template (see the params below), the same template the contact form uses.
// Failures are logged, never thrown: the order is already safe in the
// database and visible in /admin, so a missed alert loses nothing.

export async function sendAlert({ subject, message, replyTo = '' }) {
  const { EMAILJS_SERVICE_ID, EMAILJS_ALERT_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY } = process.env
  if (!EMAILJS_SERVICE_ID || !EMAILJS_ALERT_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY || !EMAILJS_PRIVATE_KEY) {
    console.log('[alert, EmailJS not configured]', subject, '\n', message)
    return false
  }
  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_ALERT_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        accessToken: EMAILJS_PRIVATE_KEY,
        template_params: {
          // Fits EmailJS's prebuilt "Contact Us" template unedited:
          // {{title}} in the subject, {{name}} / {{time}} / {{message}} in
          // the body, {{email}} as Reply-To (the customer).
          title: subject,
          name: 'Restore Estimation website',
          email: replyTo,
          time: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET',
          message,
          // also kept for custom templates
          subject,
          reply_to: replyTo,
        },
      }),
    })
    if (!res.ok) throw new Error(`EmailJS ${res.status}: ${await res.text()}`)
    return true
  } catch (err) {
    console.error('Alert email failed', err)
    return false
  }
}

export function adminLink(base, ref) {
  return `${base}/admin?order=${encodeURIComponent(ref)}`
}
