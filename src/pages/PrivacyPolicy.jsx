import { Link } from 'react-router-dom'
import LegalPage from '../components/LegalPage'
import { SITE } from '../siteConfig'
import usePageMeta from '../lib/usePageMeta'

const summary = [
  'We only ask for what we need to reply to you or write your estimate.',
  'We never sell your information or use it for advertising.',
  'Payments go through Stripe. We never see your full card number.',
  'This site sets no tracking or advertising cookies.',
  'You can ask us to see, correct, or delete your information at any time.',
]

const sections = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    content: (
      <>
        <p>
          {SITE.name} ("we", "us") writes property claim estimates for
          restoration contractors and claim professionals. This policy explains
          what information we collect through {SITE.domain}, why we collect it,
          and what you can ask us to do with it.
        </p>
        <p>
          We are responsible for the information you send us. To contact us
          about privacy, email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-collect',
    title: 'What we collect',
    content: (
      <>
        <p>We only collect information you choose to send us through our two forms.</p>
        <p><strong>Contact form:</strong> your name, email address, and your message.</p>
        <p><strong>Order form:</strong></p>
        <ul>
          <li>Your name and email address, so we can confirm the order and send the estimate.</li>
          <li>The property address, which goes on the estimate and sets the local price list.</li>
          <li>Loss type, pricing tier, and turnaround you choose.</li>
          <li>Scope notes, photos or a link to photos, measurement files, and any extra notes.</li>
        </ul>
        <p>
          We also record that you accepted our terms and this policy, and when
          you did so.
        </p>
        <p><strong>Payments:</strong> card and bank details are entered on
          Stripe's secure checkout page, not on our site. Stripe tells us the
          amount, whether the payment succeeded, and basic details such as the
          card brand and last four digits. We never see or store full card
          numbers.</p>
        <p><strong>What we do not ask for:</strong> phone numbers, homeowner
          dates of birth, Social Security numbers, or insurance policy
          numbers. Please leave these, and any card details, out of your notes
          and photos. If we receive them by mistake, we delete them.</p>
      </>
    ),
  },
  {
    id: 'how-we-use-it',
    title: 'How we use it',
    content: (
      <>
        <p>We use your information only to:</p>
        <ul>
          <li>Reply to your message or question.</li>
          <li>Prepare, deliver, revise, or supplement your estimate.</li>
          <li>Take payment, issue refunds, and keep basic business and tax records.</li>
          <li>Protect the site from spam and abuse.</li>
        </ul>
        <p>
          We do not use your information for marketing emails unless you ask
          us to, and we never use it for advertising.
        </p>
      </>
    ),
  },
  {
    id: 'homeowner-information',
    title: 'Information about homeowners and properties',
    content: (
      <p>
        Orders usually include a property address and photos of someone's home.
        When you send these, you confirm you have permission to share them with
        us for the purpose of preparing an estimate. We use them only for that
        order and treat them as confidential.
      </p>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and third-party content',
    content: (
      <>
        <p>
          This site does not use analytics, tracking pixels, or advertising
          cookies. Some content is loaded from other companies, which means
          your browser shares your IP address with them when the page loads:
        </p>
        <ul>
          <li>Google Fonts, for the typefaces on this site.</li>
          <li>Pexels, for some of the example photos on the home page.</li>
          <li>Our website host, which keeps standard server logs for security.</li>
        </ul>
        <p>
          When you go to checkout, you leave our site for Stripe's payment
          page. Stripe uses its own cookies there to process the payment and
          prevent fraud, as described in{' '}
          <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe's privacy policy</a>.
        </p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'Who we share it with',
    content: (
      <>
        <p>We never sell or rent your information. We share it only with:</p>
        <ul>
          <li>
            Service providers that help us run the business, such as Stripe
            (which processes payments), EmailJS (which delivers form
            submissions to our inbox), our email provider, and our website
            host. They may only use it to provide their service
            to us.
          </li>
          <li>Authorities, if the law requires us to.</li>
        </ul>
        <p>
          We do not send your information to insurance carriers. You decide
          where your finished estimate goes.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    content: (
      <ul>
        <li>Contact form messages: up to 12 months after our last reply.</li>
        <li>
          Order files and estimates: up to 3 years after delivery, so we can
          handle revisions, supplements, and billing questions.
        </li>
        <li>Payment and invoice records: as long as tax law requires. Stripe also keeps its own payment records as the law requires of it.</li>
      </ul>
    ),
  },
  {
    id: 'security',
    title: 'How we protect it',
    content: (
      <p>
        The site uses HTTPS, access to order files is limited to the estimators
        working on them, and we delete files we no longer need. No system is
        perfectly secure, so please only send what the estimate requires.
      </p>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your choices and rights',
    content: (
      <>
        <p>You can ask us to:</p>
        <ul>
          <li>Tell you what information we hold about you.</li>
          <li>Correct information that is wrong.</li>
          <li>Delete your information, unless we must keep it by law (for example, invoices).</li>
          <li>Send you a copy of your files.</li>
        </ul>
        <p>
          Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> from the
          address you used with us. We reply within 30 days. Depending on
          where you live (for example California, the EU, or the UK), you may
          have additional rights, and we honor them. We do not sell or share
          personal information for cross-context advertising.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    content: (
      <p>
        This site is for businesses and adults. We do not knowingly collect
        information from anyone under 16.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    content: (
      <p>
        If we change this policy, we update the date at the top of this page.
        Significant changes also appear on the order form. See also our{' '}
        <Link to="/terms">Terms and Conditions</Link> and{' '}
        <Link to="/refund-policy">Refund Policy</Link>.
      </p>
    ),
  },
]

export default function PrivacyPolicy() {
  usePageMeta({
    title: 'Privacy Policy',
    description: 'How Restore Estimation collects, uses and protects the information you send through this website.',
    path: '/privacy',
  })
  return (
    <LegalPage
      current="/privacy"
      title="Privacy Policy"
      intro="How we handle the information you send through this website, written in plain English."
      summary={summary}
      sections={sections}
    />
  )
}
