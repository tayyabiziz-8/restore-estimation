# CONTEXT.md - Restore Estimation website

Read this first when resuming work. It captures decisions, state, and gotchas
so the project can be rebuilt or continued without re-asking the client.
Keep it updated whenever something meaningful changes.

## What this is

Marketing and order-intake website for **Restore Estimation**
(restoreestimation.com), a property claim estimating service. Customers are
mostly restoration contractors and claim estimators, and the audience skews
35+ and professional. The company writes Xactimate-ready estimates for water,
fire, mold, roof and large-loss claims.

Four main pages: Home (landing), Services, Pricing, Place Order. Three legal
pages: Privacy Policy (`/privacy`), Terms and Conditions (`/terms`), Refund
Policy (`/refund-policy`), all built on `components/LegalPage.jsx`.

## Stack

- React 19 + Vite + Tailwind CSS v4 (`@tailwindcss/vite`, tokens in `@theme`)
- React Router v7 (`react-router-dom`)
- Formik + Yup for all form state and validation
- EmailJS (`@emailjs/browser`) to send form submissions straight to the
  company inbox, no backend
- No MUI, Sonner or TanStack Query on this project (kept lean on purpose)

Commands: `npm install`, `npm run dev`, `npm run build`, `npm run preview`.
User develops on Windows with PowerShell and VS Code.

## Client and branding

- Name: Restore Estimation. Earlier working names (Meridian Estimating,
  Qlaims Estimating) are dead, do not reuse.
- Domain: restoreestimation.com, registered and managed in Squarespace.
- Contact details (confirmed v9, set in `src/siteConfig.js`): email
  admin@restoreestimation.com, phone +1 (646) 774-0661. Use the same in
  Stripe Public details and as the EmailJS delivery inbox.
- Client supplied `logo.jpeg` (flat lavender-white background). Processed into
  transparent PNGs: `src/assets/logo.png` (full lockup, dark ink, for light
  backgrounds, currently unused), `src/assets/logo-light.png` (full lockup
  recolored cream and amber for the dark footer, built from the JPEG at
  higher resolution) and `src/assets/logo-mark.png` (icon only, navbar).
  Never put the dark logo on the navy footer, it disappears.
- Favicons (v10) in `public/`, made from the logo mark with the thin
  dimension lines removed so it reads at 16px: `favicon.ico` (16/32/48),
  `favicon.svg` (switches to a cream mark in dark mode), `favicon-32.png`,
  `apple-touch-icon.png`, `icon-192/512.png` + `site.webmanifest`. The
  Vite default icon and unused `icons.svg` were removed. Originals kept in
  `src/assets/logo.jpeg`. If the logo changes, redo the background knockout,
  do not drop the raw JPEG in.
- admin@restoreestimation.com is the public contact inbox. The client also
  shared its login; do not use it for anything without asking.
  Never store the password in the repo or in this file.

## Design decisions (and why)

- **Light theme.** An earlier dark blueprint theme was rejected as too
  informal for the 35+ audience. One dark navy band (footer, stats, carousel
  photo panel) is kept for contrast.
- **Architectural influence, minimal.** Hairline rules, faint blueprint grid,
  a floor-plan drawing in the hero (`BlueprintHero.jsx`). Since v7 it is a
  proper measured sketch at 12 units = 1 ft (36'-8" x 27'-6"): solid navy
  wall poché, window and door symbols with swings, amber dimension strings
  with 45 degree ticks and knocked-out text, a hatched water-affected area
  with a tag, room names (Source Serif) with sq ft, scale bar and north
  arrow. One animation sequence: construction lines draw, walls ink in,
  then openings, dimensions, hatch and labels (`.plan-*` classes in
  index.css, `pathLength="1"` on drawn paths). Under 640px the chain
  dimensions, areas, tag and scale numbers hide and remaining text grows. Corner
  registration marks and mono-uppercase labels were removed as too gimmicky.
- **Fonts.** Source Serif 4 for headings, Inter for body, Poppins (bold) only
  for the navbar wordmark to match the logo lettering. The user explicitly
  asked to stop defaulting to Space Grotesk across projects, do not use it.
- **Colors** sampled from the logo: navy `#1a2f42` (headings), amber
  `#8f6035` for text/buttons on light and `#ad7a45` (true logo amber) on dark.
  Tokens live in `src/index.css` under `@theme`.
- **No em dashes anywhere** in copy or comments (client preference). Use
  commas, colons, periods or parentheses instead.
- **Services copy is Simple English.** Short sentences, no jargon.
- **Navbar:** solid white background (no blur/translucency) so the logo stays
  crisp, logo icon is large (h-11/h-12), brand text hides below 640px.
- **Overscroll bounce disabled** via `overscroll-behavior-y: none` on html and
  body.
- **Use the full screen width.** Content container is `max-w-site`
  (`--container-site: 100rem`, 1600px) with `px-6 md:px-10 xl:px-16`. Wide
  layouts add side rails (order checklist, legal contents and summary)
  rather than stretching text; body copy stays capped around 65 to 80
  characters. The carousel flattens to 21:9 on xl so it is not too tall.
  Every change must be checked on mobile too (user request).
- **Navbar Contact.** Outline "Contact" button left of "Get an Estimate"
  (desktop) and a "Contact" text link in the mobile nav, both to
  `/#contact` (home contact section, `scroll-mt-20`). `ScrollToTop` scrolls
  to hash targets after render; on the home page the click scrolls
  directly. Brand text hides between md and lg so the bar fits tablets.
- **Scroll reveals.** `components/Reveal.jsx` (one shared
  IntersectionObserver + `.reveal` CSS, no GSAP, keeps the bundle lean).
  Variants: up (18px lift, 12px on phones), fade, scale. Used on Home
  (hero text stagger, carousel, process steps, stats, contact), Services
  rows, Pricing grid and add-ons. Pricing tier cells must not be revealed
  one by one: they sit on a hairline background that would show through.
  Reduced motion shows everything immediately.
- **Spacing kept tight.** Section padding is py-10/12 rather than py-16/24.
  Pricing tiers are 1 column on phones, 2-up from 640px, 4-up on large
  screens (2-up on phones was too cramped).

## Content decisions

Pricing tiers (Pricing.jsx and the tier dropdown in PlaceOrder.jsx must match):

| Tier | Price |
| --- | --- |
| Minor Loss | $85 |
| Total Loss | $220 (marked "Most ordered") |
| Roof Damage | $150 (the only price the client stated explicitly) |
| Large Loss | Quoted |

Minor Loss and Total Loss carried over the earlier Single Room and Full Loss
prices. Confirm these with the client. Add-ons table has codes A-01 to A-06
(rush, on-site visit, revision, extra room, sketch only, supplement).

Services: six entries (S-01 to S-06). S-05 covers estimate review and
supplements. The supplement checkbox and claim-number field were removed from
the order form at the client's request, but supplements are still offered as a
service and an add-on.

## Forms and data

- Business details (email, phone, hours, legal "last updated" date) live in
  `src/siteConfig.js`. Update there, not in each file.
- **Only collect necessary data.** Order form fields: name, email, property
  address, loss type, tier, turnaround, scope notes, files, photo link,
  notes. Phone and company were removed for data minimisation. Never add
  policy numbers, IDs, or payment fields. The side panel tells users to
  leave those out of uploads.
- **Consent.** Both forms have a required checkbox
  (`components/ConsentCheckbox.jsx`). Policy links open in a new tab so the
  form is not lost. `consent` and `consent_at` (ISO timestamp) are sent with
  each submission as the consent record.

Both forms use Formik + Yup, boxed inputs (visible borders), inline errors, a
honeypot field, and EmailJS.

- `ContactForm.jsx` (Home page): name, email, message. Uses `emailjs.send`.
- `PlaceOrder.jsx`: 1 contact, 2 property and order (incl. turnaround),
  3 scope notes/images/measurements, 4 notes, then the agreement checkbox. Uses `emailjs.sendForm` so file inputs go out as attachments.
  - Scope notes can be typed (textarea) or attached as a file or photo.
  - Also asks for a measurements file and images.
  - **At least one of Images or a Link to photos is required.** This is
    checked manually in `onSubmit` (file inputs are not Formik state), with an
    inline error and scroll to the field.
- EmailJS IDs are placeholders in both files (`YOUR_SERVICE_ID`,
  `YOUR_TEMPLATE_ID`, `YOUR_ORDER_TEMPLATE_ID`, `YOUR_PUBLIC_KEY`). Nothing
  sends until real values are pasted in. Template variable names are listed in
  README.md. Attachment size limits depend on the EmailJS plan.

## Payments (Stripe, v8)

Client chose upfront online payment (Option B) over Stripe Invoicing.
- Prices live ONLY in `src/data/pricing.js` (cents). Pricing page, order
  summary and the server all read it. Change prices there.
- Flow: order form emails order + files via EmailJS marked "Awaiting
  payment" with an order ref `RE-yymmdd-XXXX` (`src/lib/checkout.js`), then
  `POST /api/create-checkout-session` (server re-prices, validates, returns
  Stripe Checkout URL). Success page `/order/success` verifies via
  `/api/checkout-status`. `/order/cancelled` can reopen checkout from
  sessionStorage. `/api/stripe-webhook` (signature verified, raw body) is
  the real paid signal and emails the office via EmailJS REST.
- Payable online: Minor, Total, Roof tiers + rush, on-site visit, extra
  rooms (Minor and Total only, max 20). Quoted: Large Loss, "Not sure yet",
  plus revisions, supplements, sketch-only: paid later by Stripe Payment
  Link from the dashboard.
- Pricing "Order this tier" links pass `?tier=<id>` to preselect.
- Functions use Vercel's Web handler signature (`export async function
  POST(request)`), shared helpers in `api/_lib/`. `vercel.json` rewrite
  excludes `/api/`. Local dev needs `vercel dev` for the API.
- Env vars (never `VITE_`): STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
  SITE_URL, EMAILJS_SERVICE_ID, EMAILJS_PAYMENT_TEMPLATE_ID,
  EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY. See `.env.example`.
- Terms, Refund and Privacy pages were rewritten for upfront payment and
  Stripe as processor.
- Server functions were tested in the sandbox against a stub Stripe
  module (pricing, validation, webhook signature path). Real Stripe test
  mode still needs a run-through.

## Carousel

`src/components/Carousel.jsx`, four slides, auto-advance 5.5s, pauses on hover,
respects reduced motion. Controls live in the bottom bar (01 / 04 counter,
dots, square prev/next buttons with SVG chevrons), not over the photo.
Below md the caption sits on a navy panel under the photo (captions share
one grid cell so the height never jumps) and slides can be swiped; md and
up the caption overlays the photo on a gradient. Captions use
"Exhibit 01" to "Exhibit 04".

Images are pinned Pexels photos (free under the Pexels License, no attribution
required), hotlinked from `images.pexels.com`:

| Slide | Pexels photo ID |
| --- | --- |
| Water damage | 18302377 |
| On-site measurement | 5476051 |
| Fire and smoke | 10252687 |
| Estimate delivery | 7054757 |

URL pattern: `https://images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&fit=crop`.
Replace with the client's real jobsite photos when available. Ideally
self-host them in `src/assets/` for a production launch.

## Deployment and domain

Squarespace cannot host this React app. Plan: push to GitHub, deploy on Vercel
(required now that payments use Vercel functions; Netlify would need the
functions ported) (build `npm run build`, output `dist`), then add the A and CNAME
records the host gives you in Squarespace under Domains, DNS Settings. Do not
touch MX records if the domain has email. Full steps are in README.md. Not yet
deployed.

## Legal pages

Privacy, Terms and Refund pages are plain-English drafts written for this
business (pay on delivery, per-claim pricing, not a public adjuster, no
tracking cookies, EmailJS / Google Fonts / Pexels / host disclosed). They
are NOT lawyer-reviewed. Business rules invented in them that the client
must confirm: retention (contact 12 months, orders 3 years), cancellation
after work starts capped at 50% of tier, 30-day error window, free
corrections, rush fee refunded if deadline missed, refunds in 10 business
days. Governing law says "the state where Restore Estimation is
registered": replace with the real state once known. If analytics or
cookies are ever added, the privacy policy and a cookie notice must be
updated first.

SPA fallback for direct loads of these routes: `vercel.json` and
`public/_redirects` (Netlify).

## File map

```
src/
  App.jsx                    router + layout
  index.css                  design tokens + global styles
  assets/                    logo.png, logo-mark.png, logo.jpeg
  siteConfig.js              business details (email, phone, hours, dates)
  components/                Navbar, Footer, Carousel, ContactForm,
                             BlueprintHero, SectionLabel, LegalPage,
                             ConsentCheckbox, ScrollToTop
  pages/                     Home, Services, Pricing, PlaceOrder,
                             OrderResult (success + cancelled),
                             PrivacyPolicy, Terms, RefundPolicy
  data/pricing.js            prices (single source, cents)
  lib/checkout.js            order ref, start checkout, pending storage
api/                         Vercel functions: create-checkout-session,
                             checkout-status, stripe-webhook, _lib/
README.md                    setup, EmailJS wiring, deploy guide
CONTEXT.md                   this file
```

## Gotchas

- npm registry access was blocked in the v6 session, so that change set
  was syntax-checked only, not built or screenshotted. Run `npm run build`
  locally after pulling it.
- The sandbox filesystem has reset between sessions before, wiping the
  project. This file plus the zip in outputs is the recovery path.
- The dev sandbox blocks most external domains, so remote images (Pexels) do
  not render in headless screenshots there. They load fine in a normal browser.
- Background processes do not survive between separate shell calls in the
  sandbox. Start the preview server and the screenshot script in one call.
- The pricing add-ons table is wrapped in `overflow-x-auto` on purpose so it
  scrolls inside itself on narrow phones instead of widening the page.

## Open items

- Confirm the EmailJS account (delivering to admin@restoreestimation.com), then paste IDs.
- Confirm Minor Loss and Total Loss prices.
- Find out what the admin@restoreestimation.com login is for.
- Swap stock carousel photos for real ones.
- Deploy and point the domain.
- Have the legal pages reviewed, confirm the business rules listed under
  Legal pages, and set the governing-law state.
- Confirm the registered business name (LLC or similar) for the legal pages.
- Client opens the Stripe account (US entity) and invites the developer.
  Run the full test-mode checklist in README, then switch to live keys.
- Ask the client's accountant whether estimating services are taxable in
  their state (Stripe Tax is not enabled).
- Optional: proper 404 route.

## Change log

- v1 Blueprint dark theme, 4 pages, carousel, contact form (Meridian).
- v2 Light theme, Source Serif 4, Formik + Yup, boxed inputs, file asks.
- v3 Rebrand to Restore Estimation, logo, new tiers, simple-English services,
  scope notes typing, image-or-link requirement, supplement checkbox removed.
- v4 Poppins wordmark, bigger logo, solid header, no em dashes, tighter
  spacing, mobile fixes, overscroll fix.
- v5 Carousel uses pinned relevant Pexels photos. Added this CONTEXT.md.
- v6 Footer fixed (light logo on navy, 4 columns, legal links, trademark
  line). Full-width 1600px container. Privacy, Terms and Refund pages.
  Consent checkbox on both forms. Order form trimmed (no phone or company),
  side checklist panel. ScrollToTop, SPA fallback files, siteConfig.js.
- v7 Hero floor plan redrawn as a sharp measured sketch (see Design
  decisions). Old `.draw-line` / `.fade-in-annot` CSS removed.
- v8 Stripe Checkout (upfront payment): shared price list, order summary,
  3 Vercel API functions, success/cancelled pages, legal pages updated.
- v9 Real contact details, navbar Contact link to /#contact, hash
  scrolling, scroll-reveal animations (Reveal.jsx).
- v10 Copy: step 01 "Submit the details", stats 24 to 48 hours and
  3,100+ (variance stat removed, band is 2 columns), hours 9 AM to 6 PM
  EST. Logo favicons replace the Vite icon.
- v11 Mobile fixes: carousel caption and controls moved off the photo on
  phones (plus swipe), pricing tiers single column on phones.
