import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { CategoryListView } from 'src/sections/active-sections/category-view/view/category-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Income Category | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <CategoryListView categoryType="Income" />
    </>
  );
}
