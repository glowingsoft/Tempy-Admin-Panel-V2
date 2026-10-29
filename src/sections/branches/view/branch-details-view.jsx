import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';
import { usePathname, useRouter } from 'src/routes/hooks';

import { fDate, fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';

import { resolveProfileAssetUrl } from 'src/store/Reducer/upload-api';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ModuleLoading } from 'src/components/loading-screen';

import { useViewOnly } from 'src/hooks/use-view-only';

import { useActiveBranch } from '../active-branch-context';
import { getBranchDisplayName } from '../active-branch';
import { getAgencyBranchLocationLabel } from '../agency-branch-utils';
import { getBranchesNav } from '../branch-paths';
import { CQC_RATING_OPTIONS } from '../branches-constants';

function isCareHomeUser(user) {
  const permission = Number(user?.permission);
  const accountType = user?.accountState?.accountType || user?.accountType || user?.userType;
  return (
    permission === 2 ||
    accountType === 'care_home' ||
    accountType === 'careHome'
  );
}


function statusColor(status) {
  const value = String(status || 'active').toLowerCase();
  if (value === 'active') return 'success';
  if (value === 'inactive') return 'error';
  return 'default';
}

function cqcLabel(value) {
  return CQC_RATING_OPTIONS.find((item) => item.value === value)?.label || value || '';
}

function fileNameFromUrl(url) {
  const last = String(url || '').split('?')[0].split('/').filter(Boolean).pop() || '';
  try {
    return decodeURIComponent(last) || 'Document';
  } catch {
    return last || 'Document';
  }
}

/** Distinct, non-empty stored file values. */
function uniqueFiles(...lists) {
  return [...new Set(lists.flat().map((item) => String(item || '').trim()).filter(Boolean))];
}

function DetailItem({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25, wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

function DetailGrid({ children }) {
  return (
    <Box
      sx={{
        display: 'grid',
        rowGap: 2.5,
        columnGap: 3,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
      }}
    >
      {children}
    </Box>
  );
}

function SectionCard({ title, children }) {
  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Card>
  );
}

function DocumentList({ files, emptyText }) {
  if (!files.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {files.map((file) => {
        const url = resolveProfileAssetUrl(file);
        return (
          <Stack
            key={file}
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
          >
            <Iconify icon="solar:document-bold" width={22} sx={{ color: 'text.secondary', flexShrink: 0 }} />
            <Typography variant="body2" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
              {fileNameFromUrl(file)}
            </Typography>
            {url ? (
              <Button
                size="small"
                color="inherit"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<Iconify icon="solar:eye-bold" />}
              >
                View
              </Button>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );
}

export function BranchDetailsView() {
  const viewOnly = useViewOnly();
  const { id = '' } = useParams();
  const pathname = usePathname();
  const location = useLocation();
  const router = useRouter();
  const { user } = useSelector((state) => state.user);
  const careHomeMode = isCareHomeUser(user);
  const nav = getBranchesNav(pathname);
  const { allBranches, branches, loading, setActiveBranchId } = useActiveBranch();
  const stateBranch = location.state?.branch;
  const siteList = allBranches?.length ? allBranches : branches;

  const branch = useMemo(() => {
    const fromList = siteList.find((item) => String(item.id) === String(id));
    if (fromList) return fromList;
    if (stateBranch && String(stateBranch.id || stateBranch._id) === String(id)) return stateBranch;
    return null;
  }, [id, siteList, stateBranch]);

  const index = siteList.findIndex((item) => String(item.id) === String(id));
  const prevBranch = index > 0 ? siteList[index - 1] : null;
  const nextBranch = index >= 0 && index < siteList.length - 1 ? siteList[index + 1] : null;

  useEffect(() => {
    if (id) setActiveBranchId(id);
  }, [id, setActiveBranchId]);

  const goToBranch = (item) => {
    const nextId = String(item?.id || item?._id || '');
    if (!nextId) return;
    router.push(nav.details(nextId), { state: { branch: item } });
  };

  const name = getBranchDisplayName(branch) || nav.noun;
  const address = getAgencyBranchLocationLabel(branch);
  const placeLine = [
    address && address !== '—' ? address : null,
    [branch?.location?.city, branch?.location?.state, branch?.location?.country]
      .filter(Boolean)
      .join(', ') || null,
    branch?.location?.postalCode || null,
  ]
    .filter(Boolean)
    .filter((part, partIndex, list) => list.indexOf(part) === partIndex)
    .join(' · ');
  const images = Array.isArray(branch?.images) ? branch.images : [];
  const certifications = uniqueFiles(branch?.certifications || [], branch?.cqcCertificate);
  const insuranceDocuments = uniqueFiles(branch?.insuranceCertificates || [], branch?.insuranceCertificate);
  const profileIconUrl = resolveProfileAssetUrl(branch?.profileIcon || images[0]);

  const goToSection = (href) => {
    setActiveBranchId(id);
    router.push(href);
  };

  return (
    <DashboardContent maxWidth="lg">
      <CustomBreadcrumbs
        heading={name}
        links={[
          { name: 'Dashboard', href: nav.dashboard },
          { name: nav.nounPlural, href: nav.list },
          { name },
        ]}
        action={
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title={`Previous ${nav.noun.toLowerCase()}`} arrow>
              <span>
                <IconButton color="primary" disabled={!prevBranch} onClick={() => goToBranch(prevBranch)}>
                  <Iconify icon="eva:arrow-ios-back-fill" />
                </IconButton>
              </span>
            </Tooltip>
            {siteList.length > 1 && index >= 0 ? (
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 48, textAlign: 'center' }}>
                {index + 1}/{siteList.length}
              </Typography>
            ) : null}
            <Tooltip title={`Next ${nav.noun.toLowerCase()}`} arrow>
              <span>
                <IconButton color="primary" disabled={!nextBranch} onClick={() => goToBranch(nextBranch)}>
                  <Iconify icon="eva:arrow-ios-forward-fill" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 4 } }}
      />

      {loading && !branch ? <ModuleLoading /> : null}

      {!loading && !branch ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This {nav.noun.toLowerCase()} was not found.
        </Alert>
      ) : null}

      {branch ? (
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Button
              component={RouterLink}
              href={nav.list}
              color="inherit"
              size="medium"
              sx={{ alignSelf: 'flex-start' }}
            >
              Back to {nav.nounPlural.toLowerCase()}
            </Button>
            <Card sx={{ p: { xs: 2, md: 2.5 } }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', md: 'center' }}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Avatar src={profileIconUrl} alt={name} sx={{ width: 56, height: 56, flexShrink: 0 }}>
                    {name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="h5" noWrap>
                        {name}
                      </Typography>
                      <Chip
                        size="small"
                        label={branch.status || 'active'}
                        color={statusColor(branch.status)}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Stack>
                    {placeLine ? (
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
                        {placeLine}
                      </Typography>
                    ) : null}
                  </Box>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  useFlexGap
                  justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                  sx={{ flexShrink: 0 }}
                >
                  {nav.shifts ? (
                    <Button
                      size="medium"
                      variant="contained"
                      startIcon={<Iconify icon="solar:calendar-bold" />}
                      onClick={() => goToSection(nav.shifts)}
                    >
                      Shifts
                    </Button>
                  ) : null}
                  {nav.jobs ? (
                    <Button
                      size="medium"
                      variant="outlined"
                      color="inherit"
                      startIcon={<Iconify icon="solar:case-round-bold" />}
                      onClick={() => goToSection(nav.jobs)}
                    >
                      Jobs
                    </Button>
                  ) : null}
                  {nav.postJob && !viewOnly ? (
                    <Button
                      size="medium"
                      variant="outlined"
                      color="inherit"
                      startIcon={<Iconify icon="mingcute:add-line" />}
                      onClick={() => goToSection(nav.postJob)}
                    >
                      Post job
                    </Button>
                  ) : null}
                </Stack>
              </Stack>
            </Card>
          </Stack>

          <SectionCard title="Details">
            <DetailGrid>
              <DetailItem label={`${nav.noun} name`} value={name} />
              <DetailItem
                label="Status"
                value={
                  <Box component="span" sx={{ textTransform: 'capitalize' }}>
                    {branch.status || 'active'}
                  </Box>
                }
              />
              <Box sx={{ gridColumn: { sm: 'span 2', md: 'span 3' } }}>
                <DetailItem label="Full address" value={branch.location?.fullAddress} />
              </Box>
              <DetailItem label="City" value={branch.location?.city} />
              {!careHomeMode ? (
                <DetailItem label="State" value={branch.location?.state} />
              ) : null}
              <DetailItem label="Country" value={branch.location?.country} />
              <DetailItem label="Postal code" value={branch.location?.postalCode} />
              <DetailItem label="Created" value={branch.createdAt ? fDateTime(branch.createdAt) : ''} />
              <DetailItem label="Last updated" value={branch.updatedAt ? fDateTime(branch.updatedAt) : ''} />
            </DetailGrid>
          </SectionCard>

          <SectionCard title="About">
            <Typography
              variant="body2"
              color={branch.bio ? 'text.primary' : 'text.secondary'}
              sx={{ whiteSpace: 'pre-wrap' }}
            >
              {branch.bio || 'No bio added yet.'}
            </Typography>
          </SectionCard>

          <SectionCard title="Compliance">
            <DetailGrid>
              <DetailItem label="Registered with CQC" value={branch.cqcRegistered ? 'Yes' : 'No'} />
              <DetailItem label="CQC registration number" value={branch.cqcRegistrationNumber} />
              <DetailItem label="CQC rating" value={cqcLabel(branch.cqcRating)} />
              {!careHomeMode ? (
                <DetailItem
                  label="Insurance expiry date"
                  value={branch.insuranceExpiryDate ? fDate(branch.insuranceExpiryDate) : ''}
                />
              ) : null}
            </DetailGrid>

            <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              Certifications ({certifications.length})
            </Typography>
            <DocumentList files={certifications} emptyText="No certifications uploaded." />

            {!careHomeMode ? (
              <>
                <Typography variant="subtitle2" sx={{ mt: 3, mb: 1.5 }}>
                  Insurance documents ({insuranceDocuments.length})
                </Typography>
                <DocumentList files={insuranceDocuments} emptyText="No insurance documents uploaded." />
              </>
            ) : null}
          </SectionCard>

          {!careHomeMode ? (
            <SectionCard title={`Photos (${images.length})`}>
              {images.length ? (
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                  }}
                >
                  {images.map((src, imageIndex) => {
                    const url = resolveProfileAssetUrl(src);
                    return (
                      <Box
                        key={`${src}-${imageIndex}`}
                        component="a"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ display: 'block' }}
                      >
                        <Box
                          component="img"
                          src={url}
                          alt=""
                          sx={{
                            width: 1,
                            height: 120,
                            objectFit: 'cover',
                            borderRadius: 1,
                            display: 'block',
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No photos uploaded.
                </Typography>
              )}
            </SectionCard>
          ) : null}
        </Stack>
      ) : (
        <Button variant="contained" onClick={() => router.push(nav.list)}>
          Back to {nav.nounPlural.toLowerCase()}
        </Button>
      )}
    </DashboardContent>
  );
}
