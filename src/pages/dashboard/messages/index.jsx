import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';

import { MessagesView } from 'src/sections/messaging';

// ----------------------------------------------------------------------

const metadata = { title: `Messages | Dashboard - ${CONFIG.site.name}` };

export default function CareHomeMessagesPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    const isAgency = user?.accountState?.accountType === 'agency' || user?.permission === 3;
    if (isAgency) {
      router.replace(paths.dashboard.agency.messages);
    }
  }, [user, router]);

  const isAgency = user?.accountState?.accountType === 'agency' || user?.permission === 3;
  if (isAgency) return null;

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <MessagesView />
    </>
  );
}
