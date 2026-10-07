import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AdminOrgContractCard } from 'src/sections/admin/org-profile/admin-org-contract-card';
import {
  EMPTY_ORG_PROFILE_EXTRAS,
  loadOrgProfileExtras,
  mergeOrgProfileExtras,
  readFileAsAsset,
  saveOrgProfileExtras,
} from 'src/sections/admin/org-profile/admin-org-profile-store';

// ----------------------------------------------------------------------

const KIND = 'local-authority';
const MAX_FILE_BYTES = 2 * 1024 * 1024;

export function LocalAuthorityContractsView() {
  const { user } = useSelector((state) => state.user);
  const orgId = String(user?._id || user?.id || '');
  const [extras, setExtras] = useState({ ...EMPTY_ORG_PROFILE_EXTRAS });

  useEffect(() => {
    if (!orgId) return;
    setExtras(mergeOrgProfileExtras(loadOrgProfileExtras(KIND, orgId)));
  }, [orgId]);

  const handleSave = () => {
    if (!orgId) {
      toast.error('Could not save — missing account id');
      return;
    }
    saveOrgProfileExtras(KIND, orgId, extras);
    toast.success('Contract details saved');
  };

  const handleAddFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    if (files.find((file) => file.size > MAX_FILE_BYTES)) {
      toast.error('Please keep each file under 2 MB');
      return;
    }

    try {
      const assets = await Promise.all(files.map(readFileAsAsset));
      setExtras((prev) => ({
        ...prev,
        contract: {
          ...prev.contract,
          files: [...(prev.contract.files || []), ...assets].slice(0, 12),
        },
      }));
    } catch {
      toast.error('Could not read that file');
    }
  };

  const handleRemoveFile = (assetId) => {
    setExtras((prev) => ({
      ...prev,
      contract: {
        ...prev.contract,
        files: (prev.contract.files || []).filter((item) => item.id !== assetId),
      },
    }));
  };

  return (
    <DashboardContent maxWidth="lg">
      <CustomBreadcrumbs
        heading="Contracts"
        links={[
          { name: 'Dashboard', href: paths.dashboard.localAuthority.root },
          { name: 'Jobs', href: paths.dashboard.localAuthority.jobs.created },
          { name: 'Contracts' },
        ]}
        sx={{ mb: { xs: 3, md: 4 } }}
      />

      {!orgId ? (
        <Alert severity="warning">Sign in again to manage this contract.</Alert>
      ) : (
        <Stack spacing={3}>
          <AdminOrgContractCard
            contract={extras.contract}
            onChange={(contract) => setExtras((prev) => ({ ...prev, contract }))}
            onAddFiles={handleAddFiles}
            onRemoveFile={handleRemoveFile}
          />
          <Stack alignItems="flex-end">
            <Button variant="contained" onClick={handleSave}>
              Save contract
            </Button>
          </Stack>
        </Stack>
      )}
    </DashboardContent>
  );
}
