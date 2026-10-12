import { m } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useEffect, useMemo, useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Avatar from '@mui/material/Avatar';
import SvgIcon from '@mui/material/SvgIcon';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fToNow } from 'src/utils/format-time';

import { useBoolean } from 'src/hooks/use-boolean';
import { useViewOnly } from 'src/hooks/use-view-only';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { varHover } from 'src/components/animate';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomTabs } from 'src/components/custom-tabs';
import { EmptyContent } from 'src/components/empty-content';

import { handleApiError } from 'src/store/handleApiError';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
} from 'src/store/Reducer/notifications-api';
import { resolveDashboardRole } from 'src/auth/utils/role-module-redirect';

import { formatNotificationCategoryLabel } from 'src/sections/notifications/notifications-api-utils';

import { NotificationActionDialog } from 'src/sections/notifications/notification-action-dialog';
import { TermsAcceptanceDialog } from 'src/sections/dashboard-settings/terms-acceptance-dialog';


function getCreatedJobsPath(user) {
  const role = resolveDashboardRole(user);
  if (role === 'careHome') return paths.dashboard.jobs.created;
  if (role === 'hospital') return paths.dashboard.hospital.jobs.created;
  if (role === 'localAuthority') return paths.dashboard.localAuthority.jobs.created;
  if (role === 'user') return paths.dashboard.individualHomeCare.jobs.created;
  return '';
}

export function NotificationsDrawer({ sx, ...other }) {
  const drawer = useBoolean();
  const router = useRouter();
  const viewOnly = useViewOnly();
  const { user } = useSelector((state) => state.user);
  const [currentTab, setCurrentTab] = useState('all');
  const [selected, setSelected] = useState(null);
  const [termsNotification, setTermsNotification] = useState(null);

  const { data, isLoading, isFetching, isError, refetch } = useGetNotificationsQuery(
    { page: 0, limit: 50 },
    {
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );
  const [markRead, markState] = useMarkNotificationReadMutation();

  const notifications = data?.data || [];
  const totalUnRead = Number(data?.unreadCount);
  const badgeCount = Number.isFinite(totalUnRead)
    ? totalUnRead
    : notifications.filter((item) => item.isUnRead).length;

  const filtered = useMemo(() => {
    if (currentTab === 'unread') return notifications.filter((item) => item.isUnRead);
    if (currentTab === 'read') return notifications.filter((item) => !item.isUnRead);
    return notifications;
  }, [currentTab, notifications]);

  const tabs = useMemo(
    () => [
      { value: 'all', label: 'All', count: notifications.length },
      {
        value: 'unread',
        label: 'Unread',
        count: notifications.filter((item) => item.isUnRead).length,
      },
      {
        value: 'read',
        label: 'Read',
        count: notifications.filter((item) => !item.isUnRead).length,
      },
    ],
    [notifications]
  );

  const handleChangeTab = useCallback((_event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const handleOpenItem = useCallback(
    async (notification) => {
      const createdJobsPath = getCreatedJobsPath(user);
      const opensJob = notification.kind === 'shiftAlert' && notification.jobId && createdJobsPath;

      if (opensJob) {
        const query = notification.shiftId ? `?shift=${encodeURIComponent(notification.shiftId)}` : '';
        drawer.onFalse();
        router.push(`${createdJobsPath}/${notification.jobId}${query}`);
      } else if (notification.kind === 'termsUpdated') {
        drawer.onFalse();
        setTermsNotification(notification);
      } else {
        setSelected(notification);
      }

      if (notification.isUnRead && !viewOnly) {
        try {
          await markRead({ id: notification.id }).unwrap();
        } catch (err) {
          toast.error(handleApiError(err) || 'Could not mark as read');
        }
      }
    },
    [drawer, markRead, router, user, viewOnly]
  );

  const handleCloseModal = useCallback(() => {
    setSelected(null);
  }, []);

  const handleCloseTerms = useCallback(() => {
    setTermsNotification(null);
  }, []);

  const handleTermsAccepted = useCallback(async () => {
    const id = termsNotification?.id;
    setTermsNotification(null);
    if (!id) return;
    try {
      await markRead({ id, status: 'accepted' }).unwrap();
      refetch();
    } catch (err) {
      toast.error(handleApiError(err) || 'Could not update notification');
    }
  }, [markRead, refetch, termsNotification]);

  const handleMarkAllAsRead = useCallback(async () => {
    const unread = notifications.filter((item) => item.isUnRead);
    if (!unread.length) return;

    try {
      await Promise.all(unread.map((item) => markRead({ id: item.id }).unwrap()));
      toast.success('All notifications marked as read');
      refetch();
    } catch (err) {
      toast.error(handleApiError(err) || 'Could not mark all as read');
    }
  }, [markRead, notifications, refetch]);

  const renderHead = (
    <Stack direction="row" alignItems="center" sx={{ py: 2, pl: 2.5, pr: 1, minHeight: 68 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Notifications
      </Typography>

      {!!badgeCount && !viewOnly && (
        <Tooltip title="Mark all as read">
          <IconButton color="primary" onClick={handleMarkAllAsRead} disabled={markState.isLoading}>
            <Iconify icon="eva:done-all-fill" />
          </IconButton>
        </Tooltip>
      )}

      <IconButton onClick={() => refetch()} disabled={isFetching}>
        <Iconify icon="eva:refresh-fill" />
      </IconButton>

      <IconButton onClick={drawer.onFalse} sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
        <Iconify icon="mingcute:close-line" />
      </IconButton>
    </Stack>
  );

  const renderTabs = (
    <CustomTabs variant="fullWidth" value={currentTab} onChange={handleChangeTab}>
      {tabs.map((tab) => (
        <Tab
          key={tab.value}
          iconPosition="end"
          value={tab.value}
          label={tab.label}
          icon={
            <Label
              variant={((tab.value === 'all' || tab.value === currentTab) && 'filled') || 'soft'}
              color={(tab.value === 'unread' && 'info') || (tab.value === 'read' && 'success') || 'default'}
            >
              {tab.count}
            </Label>
          }
        />
      ))}
    </CustomTabs>
  );

  const renderList = (
    <Scrollbar>
      {isLoading ? (
        <LinearProgress sx={{ borderRadius: 0, height: 2 }} />
      ) : isError ? (
        <EmptyContent
          filled
          title="Could not load notifications"
          action={
            <IconButton onClick={() => refetch()}>
              <Iconify icon="eva:refresh-fill" />
            </IconButton>
          }
          sx={{ py: 6 }}
        />
      ) : !filtered.length ? (
        <EmptyContent filled title="No notifications" sx={{ py: 6 }} />
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {filtered.map((notification) => (
            <Box component="li" key={notification.id} sx={{ display: 'flex' }}>
              <ListItemButton
                disableRipple
                onClick={() => handleOpenItem(notification)}
                sx={{
                  p: 2.5,
                  alignItems: 'flex-start',
                  borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
                  ...(notification.isUnRead && {
                    bgcolor: 'action.selected',
                  }),
                }}
              >
                <ListItemAvatar>
                  {notification.avatarUrl ? (
                    <Avatar src={notification.avatarUrl} sx={{ bgcolor: 'background.neutral' }} />
                  ) : (
                    <Avatar sx={{ bgcolor: 'background.neutral' }}>
                      <Iconify icon="solar:bell-bold" width={20} />
                    </Avatar>
                  )}
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <Stack spacing={0.5}>
                      {notification.message ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {notification.message}
                        </Typography>
                      ) : null}
                      <Typography variant="caption" color="text.disabled">
                        {notification.createdAt ? fToNow(notification.createdAt) : ''}
                        {notification.category
                          ? ` · ${formatNotificationCategoryLabel(notification.category)}`
                          : ''}
                      </Typography>
                    </Stack>
                  }
                />

                {notification.isUnRead ? (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      mt: 1,
                      ml: 1,
                      flexShrink: 0,
                      borderRadius: '50%',
                      bgcolor: 'info.main',
                    }}
                  />
                ) : null}
              </ListItemButton>
            </Box>
          ))}
        </Box>
      )}
    </Scrollbar>
  );

  return (
    <>
      <IconButton
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        onClick={drawer.onTrue}
        sx={sx}
        {...other}
      >
        <Badge key={badgeCount} badgeContent={badgeCount} color="error" invisible={!badgeCount} max={99}>
          <SvgIcon>
            <path
              fill="currentColor"
              d="M18.75 9v.704c0 .845.24 1.671.692 2.374l1.108 1.723c1.011 1.574.239 3.713-1.52 4.21a25.794 25.794 0 0 1-14.06 0c-1.759-.497-2.531-2.636-1.52-4.21l1.108-1.723a4.393 4.393 0 0 0 .693-2.374V9c0-3.866 3.022-7 6.749-7s6.75 3.134 6.75 7"
              opacity="0.5"
            />
            <path
              fill="currentColor"
              d="M12.75 6a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0zM7.243 18.545a5.002 5.002 0 0 0 9.513 0c-3.145.59-6.367.59-9.513 0"
            />
          </SvgIcon>
        </Badge>
      </IconButton>

      <Drawer
        open={drawer.value}
        onClose={drawer.onFalse}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: 1, maxWidth: 420 } }}
      >
        {renderHead}
        {renderTabs}
        {renderList}
      </Drawer>

      <NotificationActionDialog
        open={Boolean(selected)}
        notification={selected}
        loading={markState.isLoading}
        onClose={handleCloseModal}
      />

      <TermsAcceptanceDialog
        open={Boolean(termsNotification)}
        onClose={handleCloseTerms}
        onAccepted={handleTermsAccepted}
      />
    </>
  );
}
