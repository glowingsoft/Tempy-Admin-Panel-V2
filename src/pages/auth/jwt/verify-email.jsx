import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { JwtVerifyEmailView } from 'src/sections/auth/jwt/jwt-verify-email-view';

// ----------------------------------------------------------------------

const metadata = { title: `Verify email | ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <JwtVerifyEmailView />
    </>
  );
}
