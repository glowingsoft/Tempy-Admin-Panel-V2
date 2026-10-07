import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/config-global';
import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Field, Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

const DEFAULT_COVER_URL = `${CONFIG.site.basePath}/assets/images/faqs/hero.jpg`;

const INITIAL_ARTICLES = [
  {
    id: 'payment-billing',
    title: 'Payment & Billing',
    description: 'Refunds, charges, subscriptions',
    coverUrl: DEFAULT_COVER_URL,
    content:
      '<h2>Payment & Billing</h2><p>Use this article to explain subscriptions, payment timing, refunds, and billing disputes.</p><h3>Refund requests</h3><p>Describe the refund process, expected timelines, and the information customers should provide.</p>',
  },
  {
    id: 'account-access',
    title: 'Account Access',
    description: 'Login, password resets, and verification help',
    coverUrl: '',
    content:
      '<h2>Account Access</h2><p>Document the main recovery steps for login issues, password resets, account verification, and locked accounts.</p><h3>Verification</h3><p>Add headings and paragraphs here to guide the user through identity verification steps.</p>',
  },
];

const createArticleSchema = zod.object({
  title: zod.string().trim().min(1, { message: 'Title is required!' }),
  description: zod.string().trim().min(1, { message: 'Short description is required!' }),
  coverUrl: zod.string().trim(),
});

const articleEditorSchema = zod.object({
  title: zod.string().trim().min(1, { message: 'Title is required!' }),
  description: zod.string().trim().min(1, { message: 'Short description is required!' }),
  coverUrl: zod.string().trim(),
  content: zod
    .string()
    .min(1, { message: 'Body is required!' })
    .refine((value) => value.replace(/<[^>]*>/g, '').trim().length > 0, {
      message: 'Body is required!',
    }),
});

const CREATE_DEFAULT_VALUES = {
  title: '',
  description: '',
  coverUrl: '',
};

// ----------------------------------------------------------------------

function AddArticleDialog({ open, onClose, onSubmit }) {
  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(createArticleSchema),
    defaultValues: CREATE_DEFAULT_VALUES,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open) {
      reset(CREATE_DEFAULT_VALUES);
    }
  }, [open, reset]);

  const handleFormSubmit = handleSubmit(async (data) => {
    onSubmit(data);
    reset(CREATE_DEFAULT_VALUES);
  });

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <Form methods={methods} onSubmit={handleFormSubmit}>
        <DialogTitle>Add article</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Field.Text name="title" label="Article title" placeholder="Payment & Billing" />

            <Field.Text name="description" label="Short description" placeholder="Short summary shown on the card" multiline rows={3} />

            <Field.Text name="coverUrl" label="Cover image URL" placeholder="Optional image URL for the detail page header" />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button color="inherit" variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <LoadingButton type="submit" color="primary" variant="contained" loading={isSubmitting}>
            Create article
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

function ArticleEditor({ article, onBack, onSave, onDelete }) {
  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(articleEditorSchema),
    defaultValues: article,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    reset(article);
  }, [article, reset]);

  const handleFormSubmit = handleSubmit(async (data) => {
    onSave({ ...article, ...data });
  });

  const hasCover = Boolean(article.coverUrl?.trim());

  return (
    <Box sx={{ px: { xs: 2, md: 6 }, pb: 5, pt: 3, display: 'flex', flexDirection: 'column' }}>
      <CustomBreadcrumbs
        heading={article.title}
        links={[{ name: 'Dashboard', href: paths.adminDashboard.root }, { name: 'Help Center', href: paths.adminDashboard.content.helpCenter }, { name: article.title }]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button color="inherit" variant="outlined" startIcon={<Iconify icon="eva:arrow-ios-back-fill" />} onClick={onBack}>
              Back to articles
            </Button>

            <Button color="error" variant="outlined" startIcon={<Iconify icon="solar:trash-bin-trash-bold" />} onClick={() => onDelete(article)}>
              Delete
            </Button>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Form methods={methods} onSubmit={handleFormSubmit}>
        <Card sx={{ overflow: 'hidden' }}>
          <Box
            sx={{
              height: { xs: 180, md: 260 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: hasCover ? `url(${article.coverUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #b8e0ff 0%, #eef7ff 100%)',
            }}
          >
            {!hasCover && (
              <Stack spacing={1} alignItems="center" sx={{ color: '#1d3b53' }}>
                <Iconify icon="solar:document-text-bold" width={42} />
                <Typography variant="subtitle2">Article cover preview</Typography>
              </Stack>
            )}
          </Box>

          <Stack spacing={3} sx={{ p: 3 }}>
            <Field.Text name="title" label="Article title" />

            <Field.Text name="description" label="Short description" multiline rows={3} />

            <Field.Text name="coverUrl" label="Cover image URL" />

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Body</Typography>
              <Field.Editor name="content" sx={{ maxHeight: 520 }} placeholder="Write the article body using headings, paragraphs, and lists..." />
            </Stack>

            <Stack direction="row" justifyContent="flex-end">
              <LoadingButton type="submit" variant="contained" color="primary" loading={isSubmitting}>
                Save article
              </LoadingButton>
            </Stack>
          </Stack>
        </Card>
      </Form>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function HelpCenterView() {
  const addDialog = useBoolean();
  const confirmDelete = useBoolean();

  const [articles, setArticles] = useState(INITIAL_ARTICLES);
  const [searchValue, setSearchValue] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [articleToDelete, setArticleToDelete] = useState(null);

  const selectedArticle = useMemo(() => articles.find((article) => article.id === selectedArticleId) || null, [articles, selectedArticleId]);

  const filteredArticles = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) return articles;

    return articles.filter((article) => article.title.toLowerCase().includes(query) || article.description.toLowerCase().includes(query));
  }, [articles, searchValue]);

  const handleCreateArticle = useCallback(
    (data) => {
      const nextId = `article-${Date.now()}`;

      const newArticle = {
        id: nextId,
        title: data.title.trim(),
        description: data.description.trim(),
        coverUrl: data.coverUrl.trim(),
        content: `<h2>${data.title.trim()}</h2><p>Start writing the article content here.</p>`,
      };

      setArticles((prev) => [newArticle, ...prev]);
      setSelectedArticleId(nextId);
      addDialog.onFalse();
      toast.success('Article created successfully!');
    },
    [addDialog]
  );

  const handleSaveArticle = useCallback((updatedArticle) => {
    setArticles((prev) => prev.map((article) => (article.id === updatedArticle.id ? updatedArticle : article)));
    toast.success('Article updated successfully!');
  }, []);

  const handleRequestDelete = useCallback(
    (article) => {
      setArticleToDelete(article);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleCloseDeleteDialog = useCallback(() => {
    confirmDelete.onFalse();
    setArticleToDelete(null);
  }, [confirmDelete]);

  const handleDeleteArticle = useCallback(() => {
    if (!articleToDelete) return;

    setArticles((prev) => prev.filter((article) => article.id !== articleToDelete.id));

    if (selectedArticleId === articleToDelete.id) {
      setSelectedArticleId(null);
    }

    handleCloseDeleteDialog();
    toast.success('Article deleted successfully!');
  }, [articleToDelete, handleCloseDeleteDialog, selectedArticleId]);

  if (selectedArticle) {
    return (
      <>
        <ArticleEditor article={selectedArticle} onBack={() => setSelectedArticleId(null)} onSave={handleSaveArticle} onDelete={handleRequestDelete} />

        <ConfirmDialog
          open={confirmDelete.value}
          onClose={handleCloseDeleteDialog}
          title="Delete article"
          content={
            <>
              Are you sure you want to delete <strong>{articleToDelete?.title}</strong>?
            </>
          }
          action={
            <Button variant="contained" color="error" onClick={handleDeleteArticle}>
              Delete
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <Box sx={{ px: { xs: 2, md: 6 }, pb: 5, pt: 3, display: 'flex', flexDirection: 'column' }}>
        <CustomBreadcrumbs
          heading="Help Center"
          links={[{ name: 'Dashboard', href: paths.adminDashboard.root }, { name: 'Help Center' }]}
          action={
            <Button variant="contained" color="primary" startIcon={<Iconify icon="mingcute:add-line" />} onClick={addDialog.onTrue}>
              Add article
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" spacing={2}>
            <TextField
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search articles..."
              sx={{ maxWidth: 420 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" width={20} sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {filteredArticles.length} of {articles.length} articles
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: 'repeat(1, minmax(0, 1fr))',
                md: 'repeat(2, minmax(0, 1fr))',
              },
            }}
          >
            {filteredArticles.length ? (
              filteredArticles.map((article) => (
                <Card
                  key={article.id}
                  onClick={() => setSelectedArticleId(article.id)}
                  sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    p: 2.5,
                    pl: 3.5,
                    transition: (theme) => theme.transitions.create(['transform', 'box-shadow']),
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: (theme) => theme.shadows[8],
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 16,
                      bottom: 16,
                      width: 6,
                      borderRadius: '0 16px 16px 0',
                      bgcolor: 'primary.main',
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="h6" sx={{ mb: 0.75 }}>
                        {article.title}
                      </Typography>

                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {article.description}
                      </Typography>
                    </Box>

                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <IconButton
                        color="error"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRequestDelete(article);
                        }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>

                      <Iconify icon="eva:arrow-ios-forward-fill" width={22} />
                    </Stack>
                  </Stack>
                </Card>
              ))
            ) : (
              <Card sx={{ p: 6, textAlign: 'center', gridColumn: '1 / -1' }}>
                <Stack spacing={1.5} alignItems="center">
                  <Iconify icon="solar:document-text-bold" width={40} sx={{ color: 'text.disabled' }} />
                  <Typography variant="subtitle1">No articles found</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Try another search term or create a new help-center article.
                  </Typography>
                </Stack>
              </Card>
            )}
          </Box>
        </Stack>
      </Box>

      <AddArticleDialog open={addDialog.value} onClose={addDialog.onFalse} onSubmit={handleCreateArticle} />

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={handleCloseDeleteDialog}
        title="Delete article"
        content={
          <>
            Are you sure you want to delete <strong>{articleToDelete?.title}</strong>?
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={handleDeleteArticle}>
            Delete
          </Button>
        }
      />
    </>
  );
}
