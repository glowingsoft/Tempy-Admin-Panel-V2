import Box from '@mui/material/Box';

import { SeoIllustration } from 'src/assets/illustrations';

import { AppWelcome } from 'src/sections/overview/app/app-welcome';

import { DashboardStatCard } from './dashboard-stat-card';

// ----------------------------------------------------------------------

const FALLBACK_STAT_META = [
  { icon: 'solar:clipboard-list-bold-duotone', color: 'success' },
  { icon: 'solar:case-round-bold-duotone', color: 'warning' },
  { icon: 'solar:clock-circle-bold-duotone', color: 'info' },
  { icon: 'solar:graph-up-bold-duotone', color: 'secondary' },
];

export function DashboardOverviewHeader({
  title,
  description,
  stats = [],
  img = <SeoIllustration hideBackground />,
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        alignItems: 'stretch',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
      }}
    >
      <AppWelcome
        title={title}
        description={description}
        img={img}
        sx={{
          width: 1,
          height: 1,
          minHeight: { md: 280 },
          pt: { xs: 3, md: 4 },
          pb: { xs: 3, md: 4 },
          pr: { xs: 3, md: 3 },
          pl: { xs: 3, md: 4 },
          gap: { xs: 3, md: 2.5 },
          '& .MuiTypography-h4': {
            fontSize: { xs: '1.5rem', md: '1.625rem' },
            lineHeight: 1.35,
          },
          '& > :last-child': {
            maxWidth: { md: 160, lg: 190 },
          },
        }}
      />

      {stats.length ? (
        <Box
          sx={{
            minWidth: 0,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gridAutoRows: '1fr',
            gap: 2.5,
          }}
        >
          {stats.map((stat, index) => {
            const fallback = FALLBACK_STAT_META[index % FALLBACK_STAT_META.length];

            return (
              <DashboardStatCard
                key={stat.title}
                title={stat.title}
                total={stat.total}
                icon={stat.icon || fallback.icon}
                color={stat.color || fallback.color}
                href={stat.href}
              />
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
}
