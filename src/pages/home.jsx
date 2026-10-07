import { Helmet } from 'react-helmet-async';

import { TempyHomeView } from 'src/sections/tempy-home/view';


const metadata = {
  title: 'Tempy - Care Staffing Marketplace',
  description:
    'Tempy connects care homes, hospitals, agencies, and qualified healthcare professionals in real time. Post shifts instantly and receive bids from agencies and freelance carers nearby.',
};

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </Helmet>

      <TempyHomeView />
    </>
  );
}
