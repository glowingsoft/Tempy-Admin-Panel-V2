import { Helmet } from 'react-helmet-async';

import { TempyAboutLegalView } from 'src/sections/tempy-home/legal/view/tempy-about-legal-view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>About Us | Tempy</title>
        <meta
          name="description"
          content="Learn about Tempy, the care staffing marketplace connecting care homes, agencies, and healthcare professionals."
        />
      </Helmet>

      <TempyAboutLegalView />
    </>
  );
}
