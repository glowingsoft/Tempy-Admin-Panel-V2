/**
 * Tempy Home Care Provider Terms and Conditions
 * Exact client draft text — do not paraphrase.
 * Version 1.0 | Draft for legal review | 12 November 2026
 */

import { buildTermsDisplayHtml } from './terms-format';

export const HOME_CARE_PROVIDER_TERMS_META = {
  version: '1.0',
  title: 'Tempy Home Care Provider Terms and Conditions',
  subtitle: 'Version 1.0 | Draft for legal review | 12 November 2026',
};

const HOME_CARE_PROVIDER_INTRO =
  'These terms apply to every home care company ("you") that offers care or support to individuals through Tempy. You must accept them before you bid on bookings or send rate offers. By accepting, you agree that every individual you meet through Tempy is booked and paid through Tempy.';

const HOME_CARE_PROVIDER_KEY_POINTS = [
  ['Booking', 'All care for a Tempy customer is booked and paid through Tempy'],
  [
    'Restricted period',
    'While you use Tempy and for 9 months after your last visit or shift with that customer',
  ],
  [
    'Bypass fee',
    'Payable if you provide care to a Tempy customer outside Tempy (see clause 1.7)',
  ],
  [
    'Your carers',
    'Your carers stay your staff; no customer can take them on directly through Tempy',
  ],
  ['Rates', 'Set by you if you choose; either side can ask for a review at any time'],
  [
    'Cancellations',
    "Under 24 hours' notice is a strike; three strikes suspend your account",
  ],
];

const HOME_CARE_PROVIDER_BODY = `1. Booking through Tempy

1.1 A Tempy customer is any individual who receives care, any family member, representative or attorney who books or pays for that care, and any care home, hospital or local authority, that you were introduced to, or first worked with, through Tempy.

1.2 People you were already supporting before Tempy introduced you to them are not Tempy customers. You must be able to show this if Tempy asks.

1.3 All care and support for a Tempy customer must be booked, invoiced and paid through Tempy. This includes extra visits, changes to hours, and care for another member of the same household.

1.4 You must not circumvent Tempy. In particular, you must not, whether acting yourself or through a connected person or business (including a related company, another agency or an associate):

provide care or services to a Tempy customer outside Tempy;

invite or encourage a Tempy customer to book you outside Tempy;

accept a request from a Tempy customer to provide care outside Tempy, or to be paid in cash or by direct transfer;

share contact details with a Tempy customer in order to arrange care outside Tempy; or

introduce a Tempy customer to a carer or another provider to arrange care outside Tempy.

1.5 Clause 1.4 applies while you use Tempy and for 9 months after your last visit or shift with that customer (the "restricted period").

1.6 If a Tempy customer asks you to provide care outside Tempy, you must decline and tell Tempy.

1.7 Bypass fee. If you breach clause 1.4, you will pay Tempy a bypass fee equal to the greater of:

(a) £500; and

(b) Tempy's usual service fees on the care provided outside Tempy.

If the value of that care cannot be established, it will be estimated as the average weekly value of your bookings with that customer in the 12 weeks before the breach, multiplied by the number of weeks in which care was provided outside Tempy, up to a maximum of 39 weeks. You agree this is a reasonable estimate of the loss Tempy would suffer.

1.8 If you breach this section, Tempy may also suspend or close your account and set the bypass fee against any money it owes you.

2. Your carers

2.1 Your carers remain your staff. Tempy does not offer a temp-to-permanent route for home care company staff.

2.2 You must not release, or agree to release, a carer to a Tempy customer to work for them directly, and you must not encourage a customer to employ or pay a carer directly.

2.3 You are responsible for your carers, including their recruitment, training, supervision, employment status and pay.

3. Your standing as a provider

3.1 You confirm that you hold, and will keep, all registrations, insurance and checks needed to provide the care you offer. This includes CQC registration where required, public liability and employer's liability insurance, and appropriate DBS checks for every carer.

3.2 You must tell Tempy straight away if any of these lapse, or if you become subject to enforcement action or a safeguarding investigation.

4. Agreed rates

4.1 If you choose, you may set your own rates for each customer and type of care, with separate day, night and weekend rates.

4.2 A rate only applies once the customer has accepted it. The customer may accept it, reject it or ask you to review it.

4.3 At any time, either you or the customer may ask for a review of the rates. New rates apply only when both sides have agreed them, and from the date they agree. Until then, the existing agreed rates continue.

4.4 You may withdraw a rate offer that has not been accepted, with no penalty.

5. Your agreement with the customer

5.1 You upload your own service agreement for each customer. The customer signs first, then you countersign. Both of you receive the copy signed by both sides.

5.2 No care can start until the agreement has been signed by both sides. A signed agreement does not expire.

5.3 You are responsible for what your agreement says, and for the care you provide. Tempy is not a party to it.

6. Cancellations

6.1 Cancelling a booking with less than 24 hours' notice before the visit or shift starts counts as a strike.

6.2 A third strike suspends your account. Strikes are cleared if Tempy reactivates your account.

7. Changes to these terms

7.1 Tempy may update these terms. You will be asked to accept each new version before you can continue bidding or sending rate offers.

7.2 Tempy keeps a record of the version you accepted, with the date, time and user.

Acceptance

By ticking "I have read and accept the terms" and selecting Accept, you confirm that you have authority to bind your company to these terms.`;

export const HOME_CARE_PROVIDER_TERMS_HTML = buildTermsDisplayHtml({
  title: HOME_CARE_PROVIDER_TERMS_META.title,
  subtitle: HOME_CARE_PROVIDER_TERMS_META.subtitle,
  intro: HOME_CARE_PROVIDER_INTRO,
  keyPoints: HOME_CARE_PROVIDER_KEY_POINTS,
  body: HOME_CARE_PROVIDER_BODY,
});

export function isHomeCareCompanyAccountKey(accountKey = '') {
  const key = String(accountKey || '').trim();
  return key === 'home_care_company' || key === 'homeCareCompany';
}
