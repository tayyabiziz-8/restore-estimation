import { Link } from 'react-router-dom'
import LegalPage from '../components/LegalPage'
import { SITE } from '../siteConfig'
import usePageMeta from '../lib/usePageMeta'

const summary = [
  'Cancel before we start and you get a full refund.',
  'If we made a mistake, we fix it free. If we cannot, you get your money back.',
  'Missed a rush deadline? We refund the rush fee.',
  'A carrier paying less than the estimate is not grounds for a refund.',
]

const sections = [
  {
    id: 'how-billing-works',
    title: 'How billing works',
    content: (
      <p>
        You pay per claim by card when you place an order, through Stripe, as
        explained in our <Link to="/terms">Terms and Conditions</Link>. Quoted
        jobs are paid once you accept the quote. This policy covers when you
        can get some or all of that money back.
      </p>
    ),
  },
  {
    id: 'cancelling',
    title: 'Cancelling an order',
    content: (
      <ul>
        <li><strong>Before work starts:</strong> email us and we refund you in full.</li>
        <li>
          <strong>After work starts, before delivery:</strong> we keep only
          what covers the work already done, never more than half the tier
          price, and refund the rest. We tell you the amount first.
        </li>
        <li><strong>After delivery:</strong> the order is complete and not refundable, except as described below.</li>
      </ul>
    ),
  },
  {
    id: 'our-mistakes',
    title: 'If we made a mistake',
    content: (
      <>
        <p>
          If the estimate has an error on our side, such as wrong measurements
          from the files you gave us or missing line items from your scope
          notes, tell us within 30 days of delivery. We will correct it free
          of charge, usually within 2 business days.
        </p>
        <p>
          If we cannot fix it, or the corrected estimate still is not usable,
          we refund the order in full or in part, depending on how much of the
          work you were able to use.
        </p>
      </>
    ),
  },
  {
    id: 'rush-fees',
    title: 'Rush and add-on fees',
    content: (
      <ul>
        <li>If we accept a rush order and miss the same-day deadline, we refund the rush fee.</li>
        <li>If an on-site visit is cancelled by us, we refund that add-on in full.</li>
      </ul>
    ),
  },
  {
    id: 'not-covered',
    title: 'What is not refundable',
    content: (
      <ul>
        <li>An insurance carrier denying, reducing, or delaying payment on a claim.</li>
        <li>Errors caused by missing, unclear, or inaccurate information you sent us.</li>
        <li>Changes to the scope after delivery. These are billed as a revision or supplement.</li>
        <li>Orders reported more than 30 days after delivery.</li>
      </ul>
    ),
  },
  {
    id: 'request',
    title: 'How to ask for a refund',
    content: (
      <>
        <p>
          Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> with your
          order reference (for example RE-260929-K7QZ, shown on your receipt),
          the property address, and a short note on what went wrong.
        </p>
        <p>
          We reply within 5 business days. Approved refunds are sent back to
          your original card or bank account through Stripe straight away and
          usually appear within 5 to 10 business days, depending on your
          bank. Stripe's processing fee is not deducted from your refund.
        </p>
      </>
    ),
  },
]

export default function RefundPolicy() {
  usePageMeta({
    title: 'Refund Policy',
    description: 'When you can cancel an estimate order, when we fix mistakes free, and how refunds work at Restore Estimation.',
    path: '/refund-policy',
  })
  return (
    <LegalPage
      current="/refund-policy"
      title="Refund Policy"
      intro="When you can cancel, when we fix things for free, and when you get money back."
      summary={summary}
      sections={sections}
    />
  )
}
