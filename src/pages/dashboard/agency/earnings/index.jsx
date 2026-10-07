import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';

import { AgencyEarningsView } from 'src/sections/agency/earnings/view/agency-earnings-view';


const metadata = { title: `Earnings | Dashboard - ${CONFIG.site.name}` };

export default function AgencyEarningsPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    const isCareHome = user?.accountState?.accountType === 'care_home' || user?.permission === 2;
    if (isCareHome) {
      router.replace(paths.dashboard.earnings);
    }
  }, [user, router]);

  const isCareHome = user?.accountState?.accountType === 'care_home' || user?.permission === 2;
  if (isCareHome) return null;

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AgencyEarningsView />
    </>
  );
}
