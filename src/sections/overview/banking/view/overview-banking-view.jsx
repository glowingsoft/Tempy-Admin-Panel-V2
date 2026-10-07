import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';

import { _bankingContacts, _bankingCreditCard, _bankingRecentTransitions } from 'src/_mock';
import { CONFIG } from 'src/config-global';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify/iconify';

import { Typography } from '@mui/material';
import { AnalyticsWidgetSummary } from '../../analytics/analytics-widget-summary';
import { BankingBalanceStatistics } from '../banking-balance-statistics';
import { BankingContacts } from '../banking-contacts';
import { BankingCurrentBalance } from '../banking-current-balance';
import { BankingExpensesCategories } from '../banking-expenses-categories';
import { BankingInviteFriends } from '../banking-invite-friends';
import { BankingOverview } from '../banking-overview';
import { BankingQuickTransfer } from '../banking-quick-transfer';
import { BankingRecentTransitions } from '../banking-recent-transitions';

// ----------------------------------------------------------------------

export function OverviewBankingView() {
  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, Welcome back 👋
      </Typography>

      <Grid container spacing={3}>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Income"
            percent={2.6}
            total={714000}
            icon={
              <img alt="icon" src={`${CONFIG.site.basePath}/assets/icons/glass/ic-glass-bag.svg`} />
            }
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [22, 8, 35, 50, 82, 84, 77, 12],
            }}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Bank Total"
            percent={-0.1}
            total={1352831}
            color="secondary"
            icon={
              <img
                alt="icon"
                src={`${CONFIG.site.basePath}/assets/icons/glass/ic-glass-users.svg`}
              />
            }
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [56, 47, 40, 62, 73, 30, 23, 54],
            }}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Cash In Hand"
            percent={2.8}
            total={1723315}
            color="warning"
            icon={
              <img alt="icon" src={`${CONFIG.site.basePath}/assets/icons/glass/ic-glass-buy.svg`} />
            }
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [40, 70, 50, 28, 70, 75, 7, 64],
            }}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Expenses"
            percent={3.6}
            total={234}
            color="error"
            icon={
              <img
                alt="icon"
                src={`${CONFIG.site.basePath}/assets/icons/glass/ic-glass-message.svg`}
              />
            }
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [56, 30, 23, 54, 47, 40, 62, 73],
            }}
          />
        </Grid>

        <Grid xs={12} md={7} lg={8}>
          <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
            <BankingOverview />

            {/* <BankingBalanceStatistics
              title="Balance statistics"
              subheader="Statistics on balance over time"
              chart={{
                series: [
                  {
                    name: 'Weekly',
                    categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
                    data: [
                      { name: 'Income', data: [24, 41, 35, 151, 49] },
                      { name: 'Savings', data: [24, 56, 77, 88, 99] },
                      { name: 'Investment', data: [40, 34, 77, 88, 99] },
                    ],
                  },
                  {
                    name: 'Monthly',
                    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
                    data: [
                      { name: 'Income', data: [83, 112, 119, 88, 103, 112, 114, 108, 93] },
                      { name: 'Savings', data: [46, 46, 43, 58, 40, 59, 54, 42, 51] },
                      { name: 'Investment', data: [25, 40, 38, 35, 20, 32, 27, 40, 21] },
                    ],
                  },
                  {
                    name: 'Yearly',
                    categories: ['2018', '2019', '2020', '2021', '2022', '2023'],
                    data: [
                      { name: 'Income', data: [76, 42, 29, 41, 27, 96] },
                      { name: 'Savings', data: [46, 44, 24, 43, 44, 43] },
                      { name: 'Investment', data: [23, 22, 37, 38, 32, 25] },
                    ],
                  },
                ],
              }}
            /> */}

            <BankingExpensesCategories
              title="Expenses categories"
              chart={{
                series: [
                  { label: 'Entertainment', value: 22 },
                  { label: 'Fuel', value: 18 },
                  { label: 'Fast food', value: 16 },
                  { label: 'Cafe', value: 17 },
                  { label: 'Сonnection', value: 14 },
                  { label: 'Healthcare', value: 22 },
                  { label: 'Fitness', value: 10 },
                  { label: 'Supermarket', value: 21 },
                ],
                icons: [
                  <Iconify icon="streamline:dices-entertainment-gaming-dices-solid" />,
                  <Iconify icon="maki:fuel" />,
                  <Iconify icon="ion:fast-food" />,
                  <Iconify icon="maki:cafe" />,
                  <Iconify icon="basil:mobile-phone-outline" />,
                  <Iconify icon="solar:medical-kit-bold" />,
                  <Iconify icon="ic:round-fitness-center" />,
                  <Iconify icon="solar:cart-3-bold" />,
                ],
              }}
            />

            <BankingRecentTransitions
              title="Recent transitions"
              tableData={_bankingRecentTransitions}
              headLabel={[
                { id: 'description', label: 'Description' },
                { id: 'date', label: 'Date' },
                { id: 'amount', label: 'Amount' },
                { id: 'status', label: 'Status' },
                { id: '' },
              ]}
            />
          </Box>
        </Grid>

        <Grid xs={12} md={5} lg={4}>
          <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
            <BankingCurrentBalance list={_bankingCreditCard} />

            <BankingQuickTransfer title="Quick transfer" list={_bankingContacts} />

            <BankingContacts
              title="Contacts"
              subheader="You have 122 contacts"
              list={_bankingContacts.slice(-5)}
            />

            <BankingInviteFriends
              price="$50"
              title={`Invite friends \n and earn`}
              description="Praesent egestas tristique nibh. Duis lobortis massa imperdiet quam."
              imgUrl={`${CONFIG.site.basePath}/assets/illustrations/illustration-receipt.webp`}
            />
          </Box>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
