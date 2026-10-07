import { Helmet } from 'react-helmet-async';

import { TempyPrivacyLegalView } from 'src/sections/tempy-home/legal/view/tempy-privacy-legal-view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Tempy</title>
        <meta name="description" content="Read how Tempy collects, uses, and protects your personal data." />
      </Helmet>

      <TempyPrivacyLegalView />
    </>
  );
}
