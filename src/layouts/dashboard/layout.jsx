import { useMemo } from 'react';

import { useTheme } from '@mui/material/styles';
import { iconButtonClasses } from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';
import { useAccountScopeGuard } from 'src/hooks/use-account-scope-guard';
import { useViewOnly } from 'src/hooks/use-view-only';

import { allLangs } from 'src/locales';
import { _contacts } from 'src/_mock';
import { varAlpha, stylesMode } from 'src/theme/styles';

import { bulletColor } from 'src/components/nav-section';
import { useSettingsContext } from 'src/components/settings';

import { useSelector } from 'react-redux';

import { Main } from './main';
import { NavMobile } from './nav-mobile';
import { layoutClasses } from '../classes';
import { NavVertical } from './nav-vertical';
import { NavHorizontal } from './nav-horizontal';
import { useNavCountBadges } from './use-nav-count-badges';
import { _account, getAccountNav } from '../config-nav-account';
import { HeaderBase } from '../core/header-base';
import { _workspaces } from '../config-nav-workspace';
import { LayoutSection } from '../core/layout-section';
import { navData as dashboardNavData } from '../config-nav-dashboard';
import { navDataAdmin as dashboardNavDataAdmin } from '../config-nav-admin-dashboard';
import { navDataCareHome } from '../config-nav-care-home';
import { navDataAgency } from '../config-nav-agency';
import { navDataHospital } from '../config-nav-hospital';
import { navDataLocalAuthority } from '../config-nav-local-authority';
import { navDataIndividualHomeCare } from '../config-nav-individual-home-care';
import { navDataHomeCareCompany } from '../config-nav-home-care-company';
import { navDataStaffMember } from '../config-nav-staff-member';
import { ImpersonationBanner } from 'src/sections/admin/impersonation-banner';
import { TermsAcceptanceDialog } from 'src/sections/dashboard-settings/terms-acceptance-dialog';
import { getDashboardRootPath } from 'src/auth/utils/dashboard-path-utils';
import { ActiveBranchProvider } from 'src/sections/branches/active-branch-context';

// ----------------------------------------------------------------------

const CREATE_ITEM_TITLE = /^(create|add|new)\b/i;

/** The nav without its "Create …" / "Add …" / "New …" entries (at any depth). */
// API prefix for each role's sidebar counts (admin and the fallback nav have none).
const NAV_API_PREFIX = new Map([
  [navDataCareHome, '/web/care-home'],
  [navDataAgency, '/web/agency'],
  [navDataHospital, '/web/hospital'],
  [navDataLocalAuthority, '/web/local-authority'],
  [navDataIndividualHomeCare, '/web/user'],
  [navDataHomeCareCompany, '/web/home-care-company'],
  [navDataStaffMember, '/web/nurse'],
]);

function withoutCreateItems(sections = []) {
  const prune = (items = []) =>
    items
      .filter((item) => !CREATE_ITEM_TITLE.test(String(item?.title || '')))
      .map((item) => (item.children ? { ...item, children: prune(item.children) } : item));

  return sections.map((section) => ({ ...section, items: prune(section.items) }));
}

function isIndividualHomeCareAccount(user) {
  const permission = Number(user?.permission);
  const accountType = user?.accountState?.accountType || user?.accountType || user?.userType;
  return (
    permission === 6 ||
    accountType === 'individual_home_care' ||
    accountType === 'individualHomeCare' ||
    accountType === 'user'
  );
}

export function DashboardLayout({ sx, children, data }) {
  useAccountScopeGuard();

  const theme = useTheme();

  const mobileNavOpen = useBoolean();

  const { user } = useSelector((state) => state.user);

  const settings = useSettingsContext();

  const navColorVars = useNavColorVars(theme, settings);

  const layoutQuery = 'lg';

  // const navData = data?.nav ?? dashboardNavDataAdmin;

  const viewOnly = useViewOnly();

  const roleNavData = useMemo(() => {
    if (user?.permission === 1) {
      return dashboardNavDataAdmin;
    }

    const accountType = user?.accountState?.accountType;

    if (accountType === 'care_home' || user?.permission === 2) {
      return navDataCareHome;
    }

    if (accountType === 'agency' || user?.permission === 3) {
      return navDataAgency;
    }

    if (accountType === 'hospital_nhs' || user?.permission === 4) {
      return navDataHospital;
    }

    if (accountType === 'local_authority' || user?.permission === 5) {
      return navDataLocalAuthority;
    }

    if (isIndividualHomeCareAccount(user)) {
      return navDataIndividualHomeCare;
    }

    if (accountType === 'home_care_company' || user?.permission === 7) {
      return navDataHomeCareCompany;
    }

    if (accountType === 'staff_member' || user?.permission === 8) {
      return navDataStaffMember;
    }

    return data?.nav ?? dashboardNavData;
  }, [user, data?.nav]);

  // Admin viewing an account gets no "Create …" / "Add …" entries — it cannot create anything.
  const scopedNavData = useMemo(
    () => (viewOnly ? withoutCreateItems(roleNavData) : roleNavData),
    [roleNavData, viewOnly]
  );

  // "New since you last looked" badges, like notification counts.
  const navData = useNavCountBadges(scopedNavData, NAV_API_PREFIX.get(roleNavData));

  const logoHref = useMemo(
    () => getDashboardRootPath(user?.permission, user?.accountState?.accountType || user?.accountType),
    [user?.permission, user?.accountState?.accountType, user?.accountType]
  );

  const accountNav = useMemo(
    () => getAccountNav({ permission: user?.permission }) || _account,
    [user?.permission]
  );

  const isNavMini = settings.navLayout === 'mini';

  const isNavHorizontal = settings.navLayout === 'horizontal';

  const isNavVertical = isNavMini || settings.navLayout === 'vertical';

  return (
    <ActiveBranchProvider>
      <>
        <NavMobile
          data={navData}
          logoHref={logoHref}
          open={mobileNavOpen.value}
          onClose={mobileNavOpen.onFalse}
          cssVars={navColorVars.section}
        />

        <LayoutSection
          /** **************************************
           * Header
           *************************************** */
          headerSection={
            <HeaderBase
              layoutQuery={layoutQuery}
              disableElevation={isNavVertical}
              onOpenNav={mobileNavOpen.onTrue}
              data={{
                nav: navData,
                langs: allLangs,
                account: accountNav,
                contacts: _contacts,
                workspaces: _workspaces,
              }}
              slotsDisplay={{
                signIn: false,
                purchase: false,
                helpLink: false,
                settings: false,
                // Customers + suppliers only (hide on admin)
                notifications: Number(user?.permission) !== 1,
                staffRequests:
                  user?.accountState?.accountType === 'staff_member' ||
                  Number(user?.permission) === 8,
                contacts: false,
              }}
              slots={{
                topArea: <ImpersonationBanner />,
                bottomArea: isNavHorizontal ? <NavHorizontal data={navData} layoutQuery={layoutQuery} cssVars={navColorVars.section} /> : null,
              }}
              slotProps={{
                toolbar: {
                  sx: {
                    [`& [data-slot="logo"]`]: {
                      display: 'none',
                    },
                    [`& [data-area="right"]`]: {
                      gap: { xs: 0, sm: 0.75 },
                    },
                    ...(isNavHorizontal && {
                      bgcolor: 'var(--layout-nav-bg)',
                      [`& .${iconButtonClasses.root}`]: {
                        color: 'var(--layout-nav-text-secondary-color)',
                      },
                      [theme.breakpoints.up(layoutQuery)]: {
                        height: 'var(--layout-nav-horizontal-height)',
                      },
                      [`& [data-slot="workspaces"]`]: {
                        color: 'var(--layout-nav-text-primary-color)',
                      },
                      [`& [data-slot="logo"]`]: {
                        display: 'none',
                        [theme.breakpoints.up(layoutQuery)]: {
                          display: 'inline-flex',
                        },
                      },
                      [`& [data-slot="divider"]`]: {
                        [theme.breakpoints.up(layoutQuery)]: {
                          display: 'flex',
                        },
                      },
                    }),
                  },
                },
                container: {
                  maxWidth: false,
                  sx: {
                    ...(isNavVertical && { px: { [layoutQuery]: 5 } }),
                  },
                },
              }}
            />
          }
          /** **************************************
           * Sidebar
           *************************************** */
          sidebarSection={
            isNavHorizontal ? null : (
              <NavVertical
                data={navData}
                logoHref={logoHref}
                isNavMini={isNavMini}
                layoutQuery={layoutQuery}
                cssVars={navColorVars.section}
                onToggleNav={() => settings.onUpdateField('navLayout', settings.navLayout === 'vertical' ? 'mini' : 'vertical')}
              />
            )
          }
          /** **************************************
           * Footer
           *************************************** */
          footerSection={null}
          /** **************************************
           * Style
           *************************************** */
          cssVars={{
            ...navColorVars.layout,
            '--layout-transition-easing': 'linear',
            '--layout-transition-duration': '120ms',
            '--layout-nav-mini-width': '88px',
            '--layout-nav-vertical-width': '280px',
            '--layout-nav-horizontal-height': '64px',
            '--layout-dashboard-content-pt': theme.spacing(1),
            '--layout-dashboard-content-pb': theme.spacing(8),
            '--layout-dashboard-content-px': theme.spacing(5),
          }}
          sx={{
            [`& .${layoutClasses.hasSidebar}`]: {
              [theme.breakpoints.up(layoutQuery)]: {
                transition: theme.transitions.create(['padding-left'], {
                  easing: 'var(--layout-transition-easing)',
                  duration: 'var(--layout-transition-duration)',
                }),
                pl: isNavMini ? 'var(--layout-nav-mini-width)' : 'var(--layout-nav-vertical-width)',
              },
            },
            ...sx,
          }}
        >
          <Main isNavHorizontal={isNavHorizontal}>{children}</Main>
        </LayoutSection>

        <TermsAcceptanceDialog />
      </>
    </ActiveBranchProvider>
  );
}

// ----------------------------------------------------------------------

function useNavColorVars(theme, settings) {
  const {
    vars: { palette },
  } = theme;

  return useMemo(() => {
    switch (settings.navColor) {
      case 'integrate':
        return {
          layout: {
            '--layout-nav-bg': palette.primary.lighter,
            '--layout-nav-horizontal-bg': varAlpha(palette.primary.mainChannel, 0.08),
            '--layout-nav-border-color': varAlpha(palette.primary.mainChannel, 0.12),
            '--layout-nav-text-primary-color': palette.text.primary,
            '--layout-nav-text-secondary-color': palette.text.secondary,
            '--layout-nav-text-disabled-color': palette.text.disabled,
            [stylesMode.dark]: {
              '--layout-nav-bg': palette.grey[900],
              '--layout-nav-border-color': varAlpha(palette.primary.mainChannel, 0.16),
              '--layout-nav-horizontal-bg': varAlpha(palette.grey['900Channel'], 0.96),
            },
          },
          section: {
            '--nav-item-root-active-bg': varAlpha(palette.primary.mainChannel, 0.12),
            '--nav-item-root-active-hover-bg': varAlpha(palette.primary.mainChannel, 0.2),
            '--nav-item-hover-bg': varAlpha(palette.primary.mainChannel, 0.08),
            '--nav-item-sub-active-bg': varAlpha(palette.primary.mainChannel, 0.12),
          },
        };
      case 'apparent':
        return {
          layout: {
            '--layout-nav-bg': palette.grey[900],
            '--layout-nav-horizontal-bg': varAlpha(palette.grey['900Channel'], 0.96),
            '--layout-nav-border-color': 'transparent',
            '--layout-nav-text-primary-color': palette.common.white,
            '--layout-nav-text-secondary-color': palette.grey[500],
            '--layout-nav-text-disabled-color': palette.grey[600],
            [stylesMode.dark]: {
              '--layout-nav-bg': palette.grey[800],
              '--layout-nav-horizontal-bg': varAlpha(palette.grey['800Channel'], 0.8),
            },
          },
          section: {
            // caption
            '--nav-item-caption-color': palette.grey[600],
            // subheader
            '--nav-subheader-color': palette.grey[600],
            '--nav-subheader-hover-color': palette.common.white,
            // item
            '--nav-item-color': palette.grey[500],
            '--nav-item-root-active-color': palette.primary.light,
            '--nav-item-root-open-color': palette.common.white,
            // bullet
            '--nav-bullet-light-color': bulletColor.dark,
            // sub
            ...(settings.navLayout === 'vertical' && {
              '--nav-item-sub-active-color': palette.common.white,
              '--nav-item-sub-open-color': palette.common.white,
            }),
          },
        };
      default:
        throw new Error(`Invalid color: ${settings.navColor}`);
    }
  }, [
    palette.background.default,
    palette.background.defaultChannel,
    palette.primary.lighter,
    palette.primary.mainChannel,
    palette.common.white,
    palette.primary.light,
    palette.text.disabled,
    palette.text.primary,
    palette.text.secondary,
    settings.navColor,
    settings.navLayout,
  ]);
}
