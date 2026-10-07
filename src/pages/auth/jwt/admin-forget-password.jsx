import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { JwtForgetPasswordView } from 'src/sections/auth/jwt';


const metadata = { title: `Admin Change Password | ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <JwtForgetPasswordView mode="admin" />
    </>
  );
}
