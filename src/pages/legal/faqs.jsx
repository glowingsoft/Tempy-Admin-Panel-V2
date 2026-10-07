import { Helmet } from 'react-helmet-async';

import { TempyFaqsLegalView } from 'src/sections/tempy-home/legal/view/tempy-faqs-legal-view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>FAQs | Tempy</title>
        <meta name="description" content="Frequently asked questions about using Tempy for care staffing." />
      </Helmet>

      <TempyFaqsLegalView />
    </>
  );
}
