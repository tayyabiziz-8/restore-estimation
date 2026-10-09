# Restore Estimation - marketing site

React + Vite + Tailwind CSS + React Router. Four main pages: Home (landing),
Services, Pricing, Place Order, plus three legal pages: Privacy Policy
(`/privacy`), Terms and Conditions (`/terms`), and Refund Policy
(`/refund-policy`). Design language: light, paper-toned
architectural aesthetic aimed at an older, professional audience: warm
off-white background, deep ink text, an amber accent sampled from the
Restore Estimation logo, Source Serif 4 for page headings, Poppins
(matching the logo's own wordmark) for the navbar brand name, hairline
rules, a faint blueprint grid, and a restrained animated floor-plan line
drawing in the hero. One dark navy section (footer, stats band, carousel
photo panel) anchors the page for contrast without going full dark-mode.

Domain: restoreestimation.com, registered/managed through Squarespace.
This is a standalone React app, not a Squarespace site builder page, see
"Deploying & connecting the domain" below for how the two fit together.

## Run it

```bash
npm install
npm run dev       # local dev server
npm run build      # production build -> dist/
npm run preview    # serve the production build locally
```

## Logo

`src/assets/logo.png` (full lockup, used in the footer) and
`src/assets/logo-mark.png` (icon only, used in the navbar) are generated
from the client-provided `logo.jpeg` with the background knocked out to
transparency. If a new logo file arrives, re-run the same background
removal rather than dropping the raw JPEG in; a flat JPEG background won't
blend with the page. The navbar's "Restore Estimation" text is set in
Poppins (bold/extra-bold) to match the logo's own lettering; the rest of
the site's headings use Source Serif 4.

## Wiring up the contact form & order form to your inbox

Both `src/components/ContactForm.jsx` (landing page) and
`src/pages/PlaceOrder.jsx` (Place Order page) validate with **Formik +
Yup**, and send email client-side via [EmailJS](https://www.emailjs.com):
no backend required. Free tier covers 200 emails/month.

The order form specifically asks for **scope notes** (typed directly, or
as an uploaded file/photo), **images**, and a **measurements file** (Step
3). At least one of Images or a link to photos is required before the
form can be submitted, validated on submit with an inline message if both
are missing.

1. Create a free EmailJS account.
2. **Email Services** -> add the inbox that should receive messages (Gmail,
   Outlook, or any SMTP) -> note the **Service ID**.
3. **Email Templates** -> create a template for the contact form (variables
   `from_name`, `from_email`, `message`, `consent`, `consent_at`) and,
   separately, one for the order form (variables `name`, `email`,
   `address`, `lossType`, `tier`, `urgency`, `scopeNotesText`, `details`,
   `filesNote`, `consent`, `consent_at`, `order_ref`, `tier_label`,
   `order_total`, `payment_status`, `extraRooms`, plus the file inputs
   `scope_notes_file`, `measurements_file`, and `images` for attachments).
   Note each **Template ID**. Keep `consent` and `consent_at` in both
   templates: they are the record that the person accepted the policies.
4. **Account** -> **General** -> copy your **Public Key**.
5. Paste the three values into the constants at the top of
   `ContactForm.jsx` and `PlaceOrder.jsx` (`EMAILJS_SERVICE_ID`,
   `EMAILJS_TEMPLATE_ID` / `EMAILJS_ORDER_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`).

The order form uses EmailJS's `sendForm` (not `send`) so the scope notes,
measurements, and images file inputs travel as attachments automatically.
Attachment support and size limits depend on your EmailJS plan, check
their pricing page if a large scope file or photo set fails to send. The
contact form has no attachments and uses the simpler `emailjs.send` call.

Both forms require a consent checkbox before sending (Yup
`oneOf([true])`). The policy links in the checkbox open in a new tab so a
half-filled form is never lost. The order form deliberately collects only
what an estimate needs: no phone, company, policy number, or payment
fields. Business details (email, phone, hours, legal "last updated" date)
live in `src/siteConfig.js`.

Both forms already have a honeypot field for basic spam protection and show
inline sending / success / error states, and both show field-level
validation errors from Yup as the person types.

## Carousel images

The landing-page carousel uses four specific photos from Pexels (free to use,
no attribution required), pinned by photo ID so the same relevant image always
shows. Swap the `img` URLs in `src/components/Carousel.jsx` for real jobsite
photos whenever they are available; the component doesn't otherwise need to
change. For launch, consider saving the images into `src/assets/` and
importing them so the site doesn't depend on an outside host.

See CONTEXT.md for project decisions, current state, and open items.

## Deploying & connecting the domain

Squarespace's own builder can't host a custom React app like this one, so
the usual path is: deploy this app to a static host, then point the
restoreestimation.com domain at it from Squarespace's DNS settings.

1. **Deploy the build.** Push this project to GitHub, then connect the repo
   to a static host such as Vercel or Netlify (both have a free tier and
   auto-detect Vite). Build command `npm run build`, output directory
   `dist`. Once deployed you'll get a temporary URL like
   `restore-estimation.vercel.app`, confirm the site works there first.
   The repo already includes the single-page-app fallback for both hosts
   (`vercel.json` and `public/_redirects`), so opening `/privacy` or
   `/order` directly, or refreshing on them, does not 404.
2. **Point the domain at it.** In Squarespace, go to **Settings -> Domains
   -> restoreestimation.com -> DNS Settings**, and add the DNS records your
   host gives you (usually an `A` record for the root domain and a `CNAME`
   for `www`). Both Vercel and Netlify show you the exact records to add
   once you attach the domain on their end.
3. **Don't touch existing MX records** if this domain also receives email
   (e.g. an @restoreestimation.com inbox) through Squarespace or another
   provider, removing those would break mail delivery. Only add/change the
   A and CNAME records for the web address itself.
4. DNS changes can take anywhere from a few minutes to 24-48 hours to
   propagate.

## Structure

```
src/
  components/   Navbar, Footer, Carousel, ContactForm, BlueprintHero,
                LegalPage, ConsentCheckbox, ScrollToTop, ...
  pages/        Home, Services, Pricing, PlaceOrder,
                PrivacyPolicy, Terms, RefundPolicy
  siteConfig.js business details shared by footer, forms, legal pages
  index.css     design tokens (@theme) + global styles
```


## Orders backend, admin and emails

Orders are saved in Supabase (database + private file storage) by
`/api/orders`; staff manage them at `/admin`. EmailJS sends only the
contact form and short alert emails. Full setup, free-plan notes and
copy-paste templates: `docs/backend-setup.md`. Schema:
`supabase/schema.sql`.

## Stripe payments

Fixed-price orders are paid upfront with Stripe Checkout. Quoted tiers
(Large Loss, "Not sure yet") send the order without payment; the office
replies with a quote and a Stripe Payment Link.

### How it works

1. Customer fills the order form. The live summary prices it from
   `src/data/pricing.js`.
2. On submit, the order and files are emailed through EmailJS with an order
   reference (`RE-yymmdd-XXXX`) and "Awaiting payment".
3. The browser calls `POST /api/create-checkout-session`. The server
   rebuilds the price from `src/data/pricing.js` (browser prices are never
   trusted) and returns a Stripe Checkout URL.
4. Customer pays on Stripe's page, then lands on `/order/success`, which
   confirms the payment with `GET /api/checkout-status`. Cancelling lands on
   `/order/cancelled`, which can reopen checkout.
5. Stripe calls `POST /api/stripe-webhook`. This is the real "paid"
   signal: it emails the office "PAID, start work" with the order ref.

### Setup

1. **Stripe account**: owned by the client's US business. Invite the
   developer under Settings > Team. Set statement descriptor, support
   email, branding and policy URLs.
2. **Install**: `npm install` (adds `stripe`). For local work with the API
   functions use the Vercel CLI: `npm i -g vercel`, then `vercel link`
   and `npm run dev:full` (`vercel dev`). Plain `npm run dev` serves the
   site but not `/api`.
3. **Env vars**: copy `.env.example` to `.env.local`, fill in the test keys.
   Never prefix them with `VITE_`.
4. **Local webhooks**: install the Stripe CLI, `stripe login`, then
   `stripe listen --forward-to localhost:3000/api/stripe-webhook`. Put the
   printed `whsec_...` in `STRIPE_WEBHOOK_SECRET`.
5. **EmailJS payment template**: a third template, variables `order_ref`,
   `payment_status`, `amount`, `customer_name`, `customer_email`,
   `property_address`, `stripe_payment`. In EmailJS > Account > Security,
   allow API requests from non-browser applications, and copy the private
   key into `EMAILJS_PRIVATE_KEY`.
6. **Test**: card `4242 4242 4242 4242`, any future date and CVC. Decline:
   `4000 0000 0000 0002`. 3D Secure: `4000 0025 0000 3155`.
7. **Production (Vercel)**: add all env vars with live keys and
   `SITE_URL=https://restoreestimation.com`. In Stripe (live mode) >
   Developers > Webhooks, add endpoint
   `https://restoreestimation.com/api/stripe-webhook` with events
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, and put its signing secret in
   `STRIPE_WEBHOOK_SECRET`. Redeploy after changing env vars.

Payment methods shown at checkout (cards, Apple Pay, Google Pay, ACH) are
switched on in Stripe > Settings > Payment methods; no code change needed.
Refunds are issued from the Stripe dashboard.

The API functions are written for Vercel. Netlify would need them moved to
`netlify/functions` with Netlify's handler format.
