import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { usePathname } from 'src/routes/hooks';

import { BranchesView } from 'src/sections/branches/view';


export default function Page() {
  const pathname = usePathname();
  const isUserLocations =
    String(pathname || '').includes('/individual-home-care/locations') ||
    String(pathname || '').includes('/individual-home-care/branches');
  const heading = isUserLocations ? 'Locations' : 'Branches';
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
