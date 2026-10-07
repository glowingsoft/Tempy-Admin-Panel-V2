import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { CONFIG } from 'src/config-global';

import { StaffDetailsView } from 'src/sections/staff/view/staff-details-view';

// ----------------------------------------------------------------------

export default function StaffDetailsPage() {
  const { id } = useParams();

  const metadata = { title: `Staff Details | Dashboard - ${CONFIG.site.name}` };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <StaffDetailsView staffId={id} />
    </>
  );
}
