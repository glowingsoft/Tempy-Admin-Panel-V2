import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import LegalView from 'src/sections/active-sections/legal-view/legal-view';
import { FaqsHero } from 'src/sections/faqs/faqs-hero';


// ----------------------------------------------------------------------

const metadata = { title: `Terms | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
    return (
        <>
            <Helmet>
                <title> {metadata.title}</title>
            </Helmet>

            <FaqsHero data={'Terms'} />
            <LegalView type={"terms"} />
        </>
    );
}
