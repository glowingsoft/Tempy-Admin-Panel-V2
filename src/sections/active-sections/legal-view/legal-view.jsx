import { LoadingButton } from '@mui/lab';
import { Alert, Box, Button, Stack } from '@mui/material';
import Paper from '@mui/material/Paper';
import { styled, useTheme } from '@mui/material/styles';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import { LoadingScreen } from 'src/components/loading-screen';
import { toast } from 'src/components/snackbar';
import { ADMIN_LEGAL_PAGE_CONFIG } from 'src/sections/dashboard-settings/dashboard-settings-api-utils';
import { quillListRules } from 'src/sections/dashboard-settings/rich-text-sx';
import { handleApiError } from 'src/store/handleApiError';
import {
  useGetAdminAboutUsQuery,
  useGetAdminPrivacyPolicyQuery,
  useGetAdminTermsConditionsQuery,
  useUpdateAdminLegalSettingMutation,
} from 'src/store/Reducer/dashboard-settings-api';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  marginBottom: theme.spacing(3),
}));

const quillModules = {
  toolbar: [
    [{ header: '1' }, { header: '2' }, { font: [] }],
    [{ size: [] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['link', 'image', 'video'],
    ['clean'],
  ],
};

const quillFormats = [
  'header',
  'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'list',
  'bullet',
  'indent',
  'align',
  'link',
  'image',
  'video',
];

function validateContent(content) {
  if (!content) return false;
  const strippedContent = content.replace(/<[^>]*>/g, '').trim();
  return strippedContent.length > 0;
}

/**
 * Admin legal CMS editor — About / Privacy / Terms
 * GET + PUT /admin/settings/update/:id
 *
 * @param {Object} props
 * @param {'about'|'policy'|'terms'} props.type
 */
export default function LegalView({ type = 'about' }) {
  const theme = useTheme();
  const pageConfig = ADMIN_LEGAL_PAGE_CONFIG[type] || ADMIN_LEGAL_PAGE_CONFIG.about;

  const [textEn, setTextEn] = useState('');
  const [errorEn, setErrorEn] = useState('');
  const [recordId, setRecordId] = useState('');
  const [contentKey, setContentKey] = useState(pageConfig.contentKey);
  const [isUpdatingEn, setIsUpdatingEn] = useState(false);

  const aboutQuery = useGetAdminAboutUsQuery(undefined, {
    skip: type !== 'about',
    refetchOnMountOrArgChange: 60,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  const privacyQuery = useGetAdminPrivacyPolicyQuery(undefined, {
    skip: type !== 'policy',
    refetchOnMountOrArgChange: 60,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  const termsQuery = useGetAdminTermsConditionsQuery(undefined, {
    skip: type !== 'terms',
    refetchOnMountOrArgChange: 60,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  const activeQuery = useMemo(() => {
    if (type === 'policy') return privacyQuery;
    if (type === 'terms') return termsQuery;
    return aboutQuery;
  }, [aboutQuery, privacyQuery, termsQuery, type]);

  const { data, isLoading, isError, error, refetch } = activeQuery;

  const [updateSetting] = useUpdateAdminLegalSettingMutation();

  useEffect(() => {
    if (data === undefined) return;

    setTextEn(data?.content || '');
    setRecordId(data?.id || '');
    setContentKey(data?.contentKey || pageConfig.contentKey);
    setErrorEn('');
  }, [data, pageConfig.contentKey, type]);

  const handleChangeEn = (value) => {
    setTextEn(value);
    if (errorEn) setErrorEn('');
  };

  const handleSaveEnglish = useCallback(async () => {
    if (!validateContent(textEn)) {
      setErrorEn('Please enter content');
      return;
    }

    if (!recordId) {
      toast.error(`${pageConfig.label} record id missing — cannot update`);
      return;
    }

    setIsUpdatingEn(true);
    try {
      await updateSetting({
        id: recordId,
        pageType: type,
        content: textEn,
        contentKey: contentKey || pageConfig.contentKey,
      }).unwrap();
      toast.success(`${pageConfig.label} updated successfully`);
      refetch();
    } catch (err) {
      const message = handleApiError(err);
      setErrorEn(message);
      toast.error(message);
    } finally {
      setIsUpdatingEn(false);
    }
  }, [contentKey, pageConfig.contentKey, pageConfig.label, recordId, refetch, textEn, type, updateSetting]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Box sx={{ px: { xs: 2, md: 6 }, pb: 5, display: 'flex', flexDirection: 'column' }}>
      <Stack spacing={4}>
        {isError && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
          >
            {handleApiError(error) || `Failed to load ${pageConfig.label}`}
          </Alert>
        )}

        {type === 'terms' && (
          <Alert severity="info">
            Saving publishes a new version of the terms. Agencies, home care companies and solo
            nurses will be asked to accept it again before they continue.
          </Alert>
        )}

        <Box>
          <StyledPaper
            elevation={3}
            sx={{
              '.ql-toolbar': {
                backgroundColor: theme?.palette.mode === 'dark' ? '#fff' : '',
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
              },
              '.ql-container': {
                minHeight: '300px',
                borderBottomLeftRadius: 4,
                borderBottomRightRadius: 4,
              },
              // Numbered lists as clauses (1. / 1.1 / 1.1.1) — the same numbering suppliers see.
              // Indent a line (Tab or the indent button) to make it a sub-clause.
              ...quillListRules('.ql-editor'),
            }}
          >
            <ReactQuill
              key={`${type}-editor-${recordId || 'empty'}-${Boolean(textEn)}`}
              value={textEn}
              onChange={handleChangeEn}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Enter content here..."
              theme="snow"
            />
          </StyledPaper>

          {errorEn && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorEn}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <LoadingButton
              onClick={handleSaveEnglish}
              color="primary"
              variant="contained"
              loading={isUpdatingEn}
              disabled={isUpdatingEn || !recordId}
            >
              Save {pageConfig.label}
            </LoadingButton>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
