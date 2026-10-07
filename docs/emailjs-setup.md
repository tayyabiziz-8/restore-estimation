# EmailJS setup

The site sends three kinds of email through EmailJS, all to
admin@restoreestimation.com:

| Template | Sent by | When |
| --- | --- | --- |
| Contact | browser (`ContactForm.jsx`) | someone uses the home page contact form |
| Order | browser (`PlaceOrder.jsx`) | an order is submitted, with files attached, marked "Awaiting payment" |
| Payment | server (`api/stripe-webhook.js`) | Stripe confirms payment: "PAID, start work" |

## 1. Plan

The free plan is not enough: it allows 2 templates (we need 3) and no
attachments. Pick:

- **Professional ($15/mo)**: unlimited templates, 2 MB attachments per
  email. Recommended. Matches the code default.
- **Personal ($9/mo)**: 6 templates, 500 KB attachments. Works, but only
  a photo or two can be uploaded. Set `VITE_EMAILJS_ATTACHMENT_LIMIT_KB=500`.
- **Business ($40/mo)**: 30 MB attachments, if the client wants customers
  to upload full photo sets instead of sharing a link. Set
  `VITE_EMAILJS_ATTACHMENT_LIMIT_KB=30720`.

The order form checks the total file size before sending and asks for a
photo link instead when it is over the limit.

## 2. Email service

Email Services > Add New Service.

- admin@ on Google Workspace: choose **Gmail**, Connect Account, sign in
  as admin@restoreestimation.com, allow "send email on your behalf".
- Microsoft 365: choose **Outlook 365**. Anything else: **SMTP server**
  with the provider's SMTP details.

Copy the **Service ID** (e.g. `service_abc123`).

## 3. Templates

Email Templates > Create New Template, one per section below. In each
template, set the fields under **Settings**, paste the body into
**Content** (Edit Content > Code editor, or plain text), Save, and copy
the **Template ID**.

### Contact

- Subject: `Website message from {{from_name}}`
- To Email: `admin@restoreestimation.com`
- From Name: `Restore Estimation website`
- Reply To: `{{from_email}}`

```
New message from the website contact form.

Name: {{from_name}}
Email: {{from_email}}

{{message}}

Consent to be contacted: {{consent}} at {{consent_at}}
```

### Order

- Subject: `New order {{order_ref}}: {{tier_label}}, {{order_total}}`
- To Email: `admin@restoreestimation.com`
- From Name: `Restore Estimation orders`
- Reply To: `{{email}}`

```
ORDER {{order_ref}}
Payment: {{payment_status}}
Do not start work until the "PAID, start work" email for this order arrives.

CUSTOMER
Name: {{name}}
Email: {{email}}

PROPERTY AND ORDER
Address: {{address}}
Loss type: {{lossType}}
Tier: {{tier_label}}
Turnaround: {{urgency}}
Extra rooms: {{extraRooms}}
Total: {{order_total}}

SCOPE NOTES
{{scopeNotesText}}

PHOTO LINK
{{filesNote}}

NOTES FOR THE ESTIMATOR
{{details}}

Attached files (if any): scope notes, measurements, images.

Accepted terms, refund and privacy policies: {{consent}} at {{consent_at}}
```

**Attachments tab** (this is what makes the uploaded files arrive):
Add Attachment > **Form File Attachment**, Parameter Name
`scope_notes_file`. Repeat for `measurements_file` and `images`. The
parameter names must match exactly.

### Payment

- Subject: `{{payment_status}}: order {{order_ref}}`
- To Email: `admin@restoreestimation.com`
- From Name: `Restore Estimation payments`
- Reply To: `{{customer_email}}`

```
Order {{order_ref}}
Status: {{payment_status}}
Amount: {{amount}}

Customer: {{customer_name}} ({{customer_email}})
Property: {{property_address}}

Stripe reference: {{stripe_payment}}
Match this to the order email with the same order reference.
```

## 4. Keys and security

Account > General: copy the **Public Key**.
Account > Security:

- **Allowed domains / origins**: add `restoreestimation.com` (and the
  `vercel.app` address while testing). Stops other sites using the key.
- **Allow EmailJS API for non-browser applications**: ON. The payment
  email is sent from the server.
- **Private Key**: copy it. Server only, never `VITE_`.

## 5. Environment variables

Local: `.env.local`. Production: Vercel > Project > Settings >
Environment Variables. **Redeploy afterwards**: `VITE_` values are baked
into the site at build time.

```
# Browser forms (public by design)
VITE_EMAILJS_SERVICE_ID=service_xxx
VITE_EMAILJS_CONTACT_TEMPLATE_ID=template_xxx
VITE_EMAILJS_ORDER_TEMPLATE_ID=template_xxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxx
VITE_EMAILJS_ATTACHMENT_LIMIT_KB=2048

# Server (payment email from the Stripe webhook)
EMAILJS_SERVICE_ID=service_xxx
EMAILJS_PAYMENT_TEMPLATE_ID=template_xxx
EMAILJS_PUBLIC_KEY=xxxxxxxx
EMAILJS_PRIVATE_KEY=xxxxxxxx
```

## 6. Test

1. Contact form: send a message, check admin@ (and spam).
2. Order: Total Loss, one small photo plus a scope-notes file, pay with
   Stripe test card 4242 4242 4242 4242. Expect the order email with both
   attachments, then the "PAID, start work" email.
3. Upload two images in one go and check both arrive. If only one does,
   use the photo link for multi-photo orders.
4. Try files over the limit: the form should ask for a link instead.
