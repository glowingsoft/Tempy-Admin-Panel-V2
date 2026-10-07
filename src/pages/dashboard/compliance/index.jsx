import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { CareHomeComplianceView } from 'src/sections/care-home/compliance/view/care-home-compliance-view';

const metadata = { title: `Compliance | Dashboard - ${CONFIG.site.name}` };

export default function CompliancePage() {
    return (
        <>
            <Helmet>
                <title>{metadata.title}</title>
            </Helmet>

            <CareHomeComplianceView />
        </>
    );
}
