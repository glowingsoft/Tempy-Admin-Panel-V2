import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import LegalView from 'src/sections/active-sections/legal-view/legal-view';
import { FaqsHero } from 'src/sections/faqs/faqs-hero';


// ----------------------------------------------------------------------

const metadata = { title: `About Us | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
    return (
        <>
            <Helmet>
                <title> {metadata.title}</title>
            </Helmet>
            
            <FaqsHero data={'About Us'} />
            <LegalView type={"about"} />
        </>
    );
}
