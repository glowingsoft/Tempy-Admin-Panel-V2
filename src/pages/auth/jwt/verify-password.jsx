import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { JwtVerifyPasswordView } from 'src/sections/auth/jwt/verify-password-view';

// ----------------------------------------------------------------------

const metadata = { title: `Verify Password | ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <JwtVerifyPasswordView />
    </>
  );
}
