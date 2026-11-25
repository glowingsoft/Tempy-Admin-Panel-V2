/**
 * Tempy Supplier Terms and Conditions
 * Exact client draft text — do not paraphrase.
 * Version 1.0 | Draft for legal review | 12 November 2026
 */

import { buildTermsDisplayHtml } from './terms-format';

export const SUPPLIER_TERMS_META = {
  version: '1.0',
  title: 'Tempy Supplier Terms and Conditions',
  subtitle: 'Version 1.0 | Draft for legal review | 12 November 2026',
};

const SUPPLIER_INTRO =
  'These terms apply to every agency, home care company and solo nurse ("you") that offers staff or services through Tempy. You must accept them before you bid on shifts or send rate offers. By accepting, you agree that every customer you meet through Tempy is booked and paid through Tempy.';

const SUPPLIER_KEY_POINTS = [
  ['Booking', 'All work with a Tempy customer is booked and paid through Tempy'],
  [
    'Restricted period',
    'While you use Tempy and for 9 months after your last shift with that customer',
  ],
  ['Bypass fee', 'Payable if you work with a Tempy customer outside Tempy (see clause 1.6)'],
  [
    'Temp to permanent',
    'Agreed by both sides, 12-week placement via Tempy, then a £200 transfer fee',
  ],
  ['Rates', 'Set by you if you choose; either side can ask for a review at any time'],
  [
    'Cancellations',
    "Under 24 hours' notice is a strike; three strikes suspend your account",
  ],
];

const SUPPLIER_BODY = `1. Booking through Tempy

1.1 A Tempy customer is any care home, individual, hospital or local authority that you were introduced to, or first worked with, through Tempy.

1.2 All work with a Tempy customer must be booked, invoiced and paid through Tempy.

1.3 You must not circumvent Tempy. In particular, you must not, whether acting yourself or through a connected person or business (including a related company, another agency or an associate):

offer or supply staff or services to a Tempy customer outside Tempy;

invite or encourage a Tempy customer to book you outside Tempy;

accept a request from a Tempy customer to work outside Tempy; or

share contact details with a Tempy customer in order to arrange work outside Tempy.

1.4 Clause 1.3 applies while you use Tempy and for 9 months after your last shift with that customer (the "restricted period").

1.5 If you receive a request from a Tempy customer to work outside Tempy, you must decline it and tell Tempy.

1.6 Bypass fee. If you breach clause 1.3, you will pay Tempy a bypass fee equal to the greater of:

(a) £500; and

(b) Tempy's usual service fees on the work carried out outside Tempy.

If the value of that work cannot be established, it will be estimated as the average weekly value of your bookings with that customer in the 12 weeks before the breach, multiplied by the number of weeks in which work was carried out outside Tempy, up to a maximum of 39 weeks. You agree this is a reasonable estimate of the loss Tempy would suffer.

1.7 If you breach this section, Tempy may also suspend or close your account and set the bypass fee against any money it owes you.

2. Temp to permanent

2.1 Request. A care home may ask, through Tempy, to take on any staff member it has booked through Tempy, including an agency worker or a solo nurse. This section does not apply to home care company staff.

2.2 Agreement. A request only goes ahead if the care home and the supplier both agree in Tempy, and the staff member confirms they are willing. Either side may decline. Until all parties have agreed, clause 1 continues to apply in full.

2.3 Placement period. Once agreed, the staff member works for the care home for 12 weeks, working the agreed weekly hours. All shifts in the placement period are booked, invoiced and paid through Tempy at the agreed rates.

2.4 Transfer. When the staff member has completed the placement period, they become a permanent member of the care home's staff. The care home pays Tempy a one-off transfer fee of £200.

2.5 Early end. If the placement ends before the 12 weeks are complete, no transfer takes place and no transfer fee is payable. Clause 1 continues to apply.

2.6 After transfer. An agency worker who transfers leaves the agency. A solo nurse who transfers may still work for other customers through Tempy.

2.7 You must not release, or agree to release, a staff member to a Tempy customer other than under this section.

3. Agreed rates

3.1 If you choose, you may set your own rates for each customer and role (for example care or senior care), with separate day, night and weekend rates.

3.2 A rate only applies once the customer has accepted it. The customer may accept it, reject it or ask you to review it.

3.3 At any time, either you or the customer may ask for a review of the rates. New rates apply only when both sides have agreed them, and from the date they agree. Until then, the existing agreed rates continue.

3.4 You may withdraw a rate offer that has not been accepted, with no penalty.

4. Your contract with the customer

4.1 You upload your own contract for each customer. The customer signs first, then you countersign. Both of you receive the copy signed by both sides.

4.2 No shift can take place between you and a customer until the contract has been signed by both sides. A signed contract does not expire.

4.3 You are responsible for what your contract says. Tempy is not a party to it.

5. Cancellations

5.1 Cancelling a booking with less than 24 hours' notice before the shift starts counts as a strike.

5.2 A third strike suspends your account. Strikes are cleared if Tempy reactivates your account.

6. Changes to these terms

6.1 Tempy may update these terms. You will be asked to accept each new version before you can continue bidding or sending rate offers.

6.2 Tempy keeps a record of the version you accepted, with the date, time and user.

Acceptance

By ticking "I have read and accept the terms" and selecting Accept, you confirm that you have authority to bind your agency, company or practice to these terms.`;

export const SUPPLIER_TERMS_HTML = buildTermsDisplayHtml({
  title: SUPPLIER_TERMS_META.title,
  subtitle: SUPPLIER_TERMS_META.subtitle,
  intro: SUPPLIER_INTRO,
  keyPoints: SUPPLIER_KEY_POINTS,
  body: SUPPLIER_BODY,
});

export function isSupplierTermsAccountKey(accountKey = '') {
  const key = String(accountKey || '').trim();
  return key === 'agency' || key === 'nurse' || key === 'staff_member';
}
