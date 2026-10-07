import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Rating from '@mui/material/Rating';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// ----------------------------------------------------------------------

export function ReviewFormDialog({
  open,
  onClose,
  title = '',
  subtitle = '',
  initialRating = 0,
  initialComment = '',
  isEditing = false,
  submitting = false,
  deleting = false,
  onSubmit,
  onDelete,
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (open) {
      setRating(Number(initialRating) || 0);
      setComment(initialComment || '');
    }
  }, [open, initialRating, initialComment]);

  const handleSubmit = () => {
    if (!rating || submitting) return;
    onSubmit?.({
      rating,
      comment: comment.trim(),
    });
  };

  return (
    <Dialog open={open} onClose={submitting || deleting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? 'Edit review' : 'Leave review'}</DialogTitle>

      <DialogContent dividers sx={{ pt: 2.5 }}>
        <Stack spacing={2}>
          {(title || subtitle) && (
            <Box>
              {title ? (
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.25 }}>
                  {title}
                </Typography>
              ) : null}
              {subtitle ? (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
          )}

          <Stack spacing={0.75}>
            <Typography variant="subtitle2">Rating</Typography>
            <Rating
              value={rating}
              precision={1}
              onChange={(event, value) => setRating(value || 0)}
            />
          </Stack>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your review"
            placeholder="Share your experience…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Box>
          {isEditing && onDelete ? (
            <LoadingButton
              color="error"
              variant="outlined"
              loading={deleting}
              disabled={submitting}
              onClick={onDelete}
            >
              Delete
            </LoadingButton>
          ) : null}
        </Box>

        <Stack direction="row" spacing={1.25}>
          <Button color="inherit" variant="outlined" onClick={onClose} disabled={submitting || deleting}>
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            color="primary"
            disabled={!rating}
            loading={submitting}
            onClick={handleSubmit}
          >
            {isEditing ? 'Update review' : 'Submit review'}
          </LoadingButton>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
