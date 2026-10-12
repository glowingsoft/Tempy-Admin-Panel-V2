import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { BranchesView } from 'src/sections/branches/view';


export default function Page() {
  const heading = 'Locations';
  const metadata = { title: `${heading} | Dashboard - ${CONFIG.site.name}` };

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <BranchesView />
    </>
  );
}
