import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getDashboardRootPath } from 'src/auth/utils/dashboard-path-utils';

import { resolveSettingsAccountKey } from 'src/sections/dashboard-settings/dashboard-settings-api-utils';
import {
  hasLocalDraftTerms,
  resolveTermsForAccount,
} from 'src/sections/dashboard-settings/resolve-terms-content';
import { DashboardCmsContentView } from 'src/sections/dashboard-settings/view/dashboard-cms-content-view';

import {
  useGetAboutUsQuery,
  useGetPrivacyPolicyQuery,
  useGetTermsConditionsQuery,
} from 'src/store/Reducer/dashboard-settings-api';

// ----------------------------------------------------------------------

function useSettingsPageContext() {
  const { user } = useSelector((state) => state.user);
  const accountType = user?.accountState?.accountType;
  const permission = user?.permission;
  const accountKey = useMemo(() => resolveSettingsAccountKey(user), [user]);
  const dashboardRoot = getDashboardRootPath(permission, accountType);

  return { accountKey, dashboardRoot };
}

export function DashboardTermsView() {
  const { accountKey, dashboardRoot } = useSettingsPageContext();
  const query = useGetTermsConditionsQuery({ accountKey }, { skip: !accountKey });
  const termsData = useMemo(
    () => resolveTermsForAccount(accountKey, query.data),
    [accountKey, query.data]
  );
  const hasLocalTerms = hasLocalDraftTerms(accountKey);

  return (
    <DashboardCmsContentView
      contentType="terms"
      accountKey={accountKey}
      dashboardRoot={dashboardRoot}
      data={termsData}
      isLoading={query.isLoading && !hasLocalTerms}
      isFetching={query.isFetching && !hasLocalTerms}
      isError={query.isError && !hasLocalTerms}
      errorMessage={query.error?.data?.message || query.error?.error || ''}
      onRetry={query.refetch}
    />
  );
}

export function DashboardAboutView() {
  const { accountKey, dashboardRoot } = useSettingsPageContext();
  const query = useGetAboutUsQuery({ accountKey }, { skip: !accountKey });

  return (
    <DashboardCmsContentView
      contentType="about"
      accountKey={accountKey}
      dashboardRoot={dashboardRoot}
      data={query.data}
      isLoading={query.isLoading}
      isFetching={query.isFetching}
      isError={query.isError}
      errorMessage={query.error?.data?.message || query.error?.error || ''}
      onRetry={query.refetch}
    />
  );
}

export function DashboardPrivacyView() {
  const { accountKey, dashboardRoot } = useSettingsPageContext();
  const query = useGetPrivacyPolicyQuery({ accountKey }, { skip: !accountKey });

  return (
    <DashboardCmsContentView
      contentType="privacy"
      accountKey={accountKey}
      dashboardRoot={dashboardRoot}
      data={query.data}
      isLoading={query.isLoading}
      isFetching={query.isFetching}
      isError={query.isError}
      errorMessage={query.error?.data?.message || query.error?.error || ''}
      onRetry={query.refetch}
    />
  );
}
