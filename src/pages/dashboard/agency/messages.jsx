import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';

import { MessagesView } from 'src/sections/messaging';

// ----------------------------------------------------------------------

const metadata = { title: `Messages | Agency Dashboard - ${CONFIG.site.name}` };

export default function AgencyMessagesPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    const isCareHome = user?.accountState?.accountType === 'care_home' || user?.permission === 2;
    if (isCareHome) {
      router.replace(paths.dashboard.messages);
    }
  }, [user, router]);

  const isCareHome = user?.accountState?.accountType === 'care_home' || user?.permission === 2;
  if (isCareHome) return null;

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <MessagesView />
    </>
  );
}
