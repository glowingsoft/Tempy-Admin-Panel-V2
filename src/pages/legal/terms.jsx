import { Helmet } from 'react-helmet-async';

import { TempyTermsLegalView } from 'src/sections/tempy-home/legal/view/tempy-terms-legal-view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Terms of Service | Tempy</title>
        <meta name="description" content="Terms and conditions for using the Tempy care staffing platform." />
      </Helmet>

      <TempyTermsLegalView />
    </>
  );
}
